const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');  // This now uses our Supabase wrapper
const supabase = require('../config/supabase');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');
const { formatPhoneNumber } = require('../utils/validation');
const { handleMessage } = require('../services/chatbot');

// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

async function handlePayment(data, senderPhoneNumber) {
  console.log('=== START PAYMENT PROCESSING ===');
  console.log('Payment data:', { data, senderPhoneNumber });
  
  const { name, amount, direction } = data;
  
  if (!name || !amount) {
    console.log('Invalid payment data - missing name or amount');
    return { 
      error: 'Invalid payment information',
      responseMessage: "I couldn't process that payment. Please include who the payment is to/from and the amount. For example: 'Received 500 from Rahul' or 'Paid 1000 to Priya via UPI'."
    };
  }

  try {
    // Find or create customer by name
    console.log('Looking up customer:', name);
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', name)
      .single();

    console.log('Customer lookup result:', { customer, customerError });

    if (customerError || !customer) {
      // Create new customer with just the name
      const uniqueId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log('Creating new customer with ID:', uniqueId);
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{ 
          name,
          phone_number: uniqueId
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        throw createError;
      }
      console.log('Created new customer:', newCustomer);
      customer = newCustomer;
    }

    // Map the direction to the correct enum value
    // If message says "received from Kumar", it means Kumar PAID (CREDIT)
    // If message says "paid to Kumar", it means Kumar was PAID (DEBIT)
    const paymentDirection = direction === 'received' ? 'CREDIT' : 'DEBIT';
    console.log('Payment direction:', { direction, paymentDirection });

    // Create payment record
    console.log('Creating payment record:', {
      amount,
      direction: paymentDirection,
      customer_id: customer.id,
      recorded_by: senderPhoneNumber
    });
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        amount,
        direction: paymentDirection,
        date: new Date().toISOString(),
        method: 'Cash',
        customer_id: customer.id,
        recorded_by: senderPhoneNumber
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw paymentError;
    }
    console.log('Created payment record:', payment);

    // Calculate balance
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customer.id);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }

    // Recalculate balance: 
    // When we receive money (CREDIT), it reduces their balance (they paid us)
    // When we pay money (DEBIT), it increases their balance (we owe them)
    const balance = payments.reduce((acc, payment) => {
      return payment.direction === 'CREDIT' 
        ? acc - payment.amount  // They paid us, so they owe us less
        : acc + payment.amount; // We paid them, so they owe us more (negative means we owe them)
    }, 0);

    console.log('Calculated balance:', balance);

    const formattedAmount = formatCurrency(amount);
    const formattedBalance = formatCurrency(Math.abs(balance));
    
    // Clarify the message based on direction
    let responseMessage;
    if (direction === 'received') {
      responseMessage = `✅ Successfully recorded: You received ${formattedAmount} from ${name}`;
    } else {
      responseMessage = `✅ Successfully recorded: You paid ${formattedAmount} to ${name}`;
    }
    
    // Add balance with clearer wording
    responseMessage += `\n\nCurrent balance with ${name}: ${formattedBalance}`;
    responseMessage += balance >= 0 ? ' (they owe you)' : ' (you owe them)';

    console.log('=== END PAYMENT PROCESSING ===');
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
        const greetingResponse = handleGreeting(senderNumber);
        responseMessage = greetingResponse.message;
        messageType = 'greeting';
        break;
      case 'HELP':
        const helpResponse = handleHelp();
        responseMessage = helpResponse.message;
        messageType = 'help';
        break;
      case 'PAYMENT':
        const result = await handlePayment(parsedMessage, senderNumber);
        responseMessage = result.message;
        messageType = 'payment';
        break;
      case 'BALANCE_QUERY':
        const balanceResult = await handleBalanceQuery(parsedMessage.name, senderNumber);
        responseMessage = balanceResult.message;
        messageType = 'balance';
        break;
      case 'HISTORY_QUERY':
        const historyResult = await handleHistoryQuery(parsedMessage.name, senderNumber);
        responseMessage = historyResult.message;
        messageType = 'history';
        break;
      default:
        const unclearResponse = handleUnclear();
        responseMessage = unclearResponse.message;
        messageType = 'unclear';
    }

    // Log the message
    await logMessage(senderNumber, text, responseMessage, messageType);

    // Return the response message without sending it
    res.json({ success: true, message: responseMessage });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process the webhook request' 
    });
  }
});

// Handle incoming webhook messages
router.post('/chat', async (req, res) => {
    try {
        const { from, message } = req.body;
        
        if (!from || !message) {
            return res.status(400).json({ error: 'From and message are required' });
        }

        const phoneNumber = formatPhoneNumber(from);
        const response = await handleMessage(phoneNumber, message);

        // Store the message
        await supabase
            .from('chat_messages')
            .insert([{
                phone_number: phoneNumber,
                content: message,
                message_type: 'INCOMING'
            }]);

        // Store the response
        await supabase
            .from('chat_messages')
            .insert([{
                phone_number: phoneNumber,
                content: response.message,
                message_type: 'OUTGOING'
            }]);

        res.json({ 
            success: true,
            message: response.message
        });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get chat history for a business
router.get('/history/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { customerPhone } = req.query;

        const messages = await pool.query(
            `SELECT cm.* 
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cs.business_id = $1
             AND ($2::text IS NULL OR cs.customer_phone = $2)
             ORDER BY cm.sent_at DESC
             LIMIT 100`,
            [businessId, customerPhone || null]
        );

        res.json({ messages: messages.rows });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get active chat sessions for a business
router.get('/sessions/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const sessions = await pool.query(
      `SELECT cs.*, 
              c.name as customer_name,
              COUNT(cm.id) as unread_count
       FROM chat_sessions cs
       LEFT JOIN customers c ON c.phone_number = cs.customer_phone AND c.business_id = cs.business_id
       LEFT JOIN chat_messages cm ON cm.session_id = cs.id AND cm.message_type = 'INCOMING' AND cm.is_read = false
       WHERE cs.business_id = $1 AND cs.is_active = true
       GROUP BY cs.id, c.name
       ORDER BY cs.last_interaction DESC`,
      [businessId]
    );

    res.json({ sessions: sessions.rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a chat session
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const messages = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY sent_at ASC`,
      [sessionId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages 
       SET is_read = true 
       WHERE session_id = $1 AND message_type = 'INCOMING' AND is_read = false`,
      [sessionId]
    );

    res.json({ messages: messages.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message in a chat session
router.post('/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    // Get session details
    const sessionResult = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Store the message
    const messageResult = await pool.query(
      `INSERT INTO chat_messages (session_id, message_type, content)
       VALUES ($1, 'OUTGOING', $2)
       RETURNING *`,
      [sessionId, content]
    );

    // Update session last interaction time
    await pool.query(
      `UPDATE chat_sessions 
       SET last_interaction = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionId]
    );

    // TODO: Send the message through the messaging provider
    // This would integrate with your WhatsApp/messaging service

    res.json({ message: messageResult.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
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