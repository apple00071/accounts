const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

async function handlePayment(data, senderPhoneNumber) {
  const { name, amount, direction } = data;
  
  if (!name || !amount) {
    return { 
      error: 'Invalid payment information',
      responseMessage: "I couldn't process that payment. Please include who the payment is to/from and the amount. For example: 'Received 500 from Rahul' or 'Paid 1000 to Priya via UPI'."
    };
  }

  try {
    // Find or create customer by name (not sender's phone number)
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', name)
      .single();

    if (customerError || !customer) {
      // Create new customer with the name from the message
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{ 
          name,
          phone_number: null // We don't know customer's phone number yet
        }])
        .select()
        .single();

      if (createError) throw createError;
      customer = newCustomer;
    }

    // Map the direction to the correct enum value
    const paymentDirection = direction === 'paid' ? 'DEBIT' : 'CREDIT';

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        amount,
        direction: paymentDirection,
        date: new Date().toISOString(),
        method: 'Cash',
        customer_id: customer.id,
        recorded_by: senderPhoneNumber // Track who recorded this payment
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Calculate balance
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customer.id);

    if (paymentsError) throw paymentsError;

    const balance = payments.reduce((acc, payment) => {
      return payment.direction === 'CREDIT' 
        ? acc + payment.amount 
        : acc - payment.amount;
    }, 0);

    const formattedAmount = formatCurrency(amount);
    const formattedBalance = formatCurrency(Math.abs(balance));
    
    const action = paymentDirection === 'CREDIT' ? 'received' : 'paid';
    let responseMessage = `✅ Successfully recorded: ${formattedAmount} ${action} ${direction === 'paid' ? 'to' : 'from'} ${name}`;
    responseMessage += `.\n\nCurrent balance with ${name}: ${formattedBalance} ${balance >= 0 ? '(to receive)' : '(to pay)'}`;

    return {
      message: responseMessage,
      payment,
      balance
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { 
      error: 'Failed to record payment',
      responseMessage: "I couldn't save that payment due to a technical issue. Please try again later."
    };
  }
}

async function handleBalanceQuery(name, phoneNumber) {
  try {
    let query = supabase
      .from('customers')
      .select(`
        *,
        payments (*)
      `);
    
    if (name) {
      query = query.or(`name.ilike.${name},phone_number.eq.${phoneNumber}`);
    } else {
      query = query.eq('phone_number', phoneNumber);
    }
    
    const { data: customer, error: customerError } = await query.single();

    if (customerError || !customer) {
      return { 
        error: 'Customer not found',
        responseMessage: name 
          ? `I couldn't find any records for ${name}. Please check the spelling or add them as a new customer.`
          : "I couldn't find your records in our system. Would you like to add a payment to get started?"
      };
    }

    const balance = customer.payments.reduce((acc, payment) => {
      return payment.direction === 'CREDIT' 
        ? acc + payment.amount 
        : acc - payment.amount;
    }, 0);

    const totalReceived = customer.payments
      .filter(p => p.direction === 'CREDIT')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalPaid = customer.payments
      .filter(p => p.direction === 'DEBIT')
      .reduce((sum, p) => sum + p.amount, 0);

    const formattedBalance = formatCurrency(Math.abs(balance));
    const formattedReceived = formatCurrency(totalReceived);
    const formattedPaid = formatCurrency(totalPaid);
    
    let responseMessage = `📊 *Balance Statement for ${customer.name}*\n\n`;
    responseMessage += `Total Received: ${formattedReceived}\n`;
    responseMessage += `Total Paid: ${formattedPaid}\n`;
    responseMessage += `Current Balance: ${formattedBalance} ${balance >= 0 ? '(to receive)' : '(to pay)'}`;

    return { 
      message: responseMessage,
      customerData: {
        name: customer.name,
        totalReceived,
        totalPaid,
        balance
      }
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return { 
      error: 'Failed to fetch balance',
      responseMessage: "I couldn't retrieve the balance information due to a technical issue. Please try again later."
    };
  }
}

async function handleHistoryQuery(name, phoneNumber) {
  try {
    let query = supabase
      .from('customers')
      .select(`
        *,
        payments (*)
      `);
    
    if (name) {
      query = query.or(`name.ilike.${name},phone_number.eq.${phoneNumber}`);
    } else {
      query = query.eq('phone_number', phoneNumber);
    }
    
    const { data: customer, error: customerError } = await query.single();

    if (customerError || !customer) {
      return { 
        error: 'Customer not found',
        responseMessage: name 
          ? `I couldn't find any records for ${name}. Please check the spelling or add them as a new customer.`
          : "I couldn't find your records in our system. Would you like to add a payment to get started?"
      };
    }

    // Sort payments by date in descending order and take the last 5
    const recentPayments = [...customer.payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recentPayments.length === 0) {
      return { 
        message: `No transaction history found for ${customer.name}. Add a payment to get started.`
      };
    }

    const history = recentPayments.map(payment => {
      const date = new Date(payment.date).toLocaleDateString();
      const amount = formatCurrency(payment.amount);
      const direction = payment.direction === 'CREDIT' ? 'Received' : 'Paid';
      const method = payment.method || 'Cash';
      const note = payment.note ? ` (${payment.note})` : '';
      
      return `${date}: ${direction} ${amount} via ${method}${note}`;
    }).join('\n');

    return { 
      message: `📝 *Recent Transactions for ${customer.name}*\n\n${history}`,
      customerData: {
        name: customer.name,
        transactions: recentPayments
      }
    };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { 
      error: 'Failed to fetch history',
      responseMessage: "I couldn't retrieve the transaction history due to a technical issue. Please try again later."
    };
  }
}

function handleGreeting(phoneNumber) {
  return {
    message: `👋 Hello! Welcome to WhatsApp Accounting.\n\nHow can I help you today?\n\n- Record a payment\n- Check balance\n- View transaction history\n- Type "help" for more information`
  };
}

function handleHelp() {
  return {
    message: `📚 *WhatsApp Accounting Help*\n\nHere's how you can use me:\n\n*Recording Payments*\n- "Received 500 from Rahul"\n- "Paid 1000 to Priya via UPI"\n- "Got 2500 from Jay on 15th June"\n\n*Checking Balance*\n- "Balance for Rahul"\n- "What's my balance?"\n\n*Viewing History*\n- "Show transactions for Priya"\n- "Show my history"\n\nFor more help, contact customer support.`
  };
}

function handleUnclear() {
  return {
    message: `I'm not sure what you mean. Here are some things you can do:\n\n- Record a payment: "Received 500 from Rahul"\n- Check balance: "Balance for Rahul"\n- View history: "Show transactions for Priya"\n\nType "help" for more information.`
  };
}

// Log messages for auditing/debugging
async function logMessage(from, text, responseMessage, messageType) {
  try {
    // In a real implementation, you would log to database
    console.log(`[MESSAGE LOG] From: ${from}, Type: ${messageType}`);
    console.log(`> Received: ${text}`);
    console.log(`> Response: ${responseMessage}`);
  } catch (error) {
    console.error('Error logging message:', error);
  }
}

// Webhook route handler
router.post('/', async (req, res) => {
  try {
    const { from: senderNumber, text } = req.body;
    
    if (!senderNumber || !text) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both "from" and "text" fields are required' 
      });
    }

    let responseMessage;
    let messageType = 'unknown';

    // Parse the incoming message
    const parsedMessage = parseMessage(text);
    
    switch (parsedMessage.type) {
      case 'GREETING':
        responseMessage = handleGreeting(senderNumber);
        messageType = 'greeting';
        break;
      case 'HELP':
        responseMessage = handleHelp();
        messageType = 'help';
        break;
      case 'PAYMENT':
        const result = await handlePayment(parsedMessage, senderNumber);
        responseMessage = result.responseMessage || result.message;
        messageType = 'payment';
        break;
      case 'BALANCE_QUERY':
        const balanceResult = await handleBalanceQuery(parsedMessage.name, senderNumber);
        responseMessage = balanceResult.responseMessage || balanceResult.message;
        messageType = 'balance';
        break;
      case 'HISTORY_QUERY':
        const historyResult = await handleHistoryQuery(parsedMessage.name, senderNumber);
        responseMessage = historyResult.responseMessage || historyResult.message;
        messageType = 'history';
        break;
      default:
        responseMessage = handleUnclear();
        messageType = 'unclear';
    }

    // Log the message
    await logMessage(senderNumber, text, responseMessage, messageType);

    // Send response back to the sender's number
    await sendWhatsAppMessage(senderNumber, responseMessage);

    res.json({ success: true, message: responseMessage });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process the webhook request' 
    });
  }
});

module.exports = router;

// Export handler functions for use in the BotBiz polling service
module.exports.handlers = {
  handlePayment,
  handleBalanceQuery,
  handleHistoryQuery,
  handleGreeting,
  handleHelp,
  handleUnclear
}; 