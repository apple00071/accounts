/**
 * BotBiz WhatsApp Webhook Handler
 * 
 * This route handles incoming webhooks from BotBiz for WhatsApp integration.
 * It verifies incoming requests and forwards the messages to the main webhook handler.
 */

const express = require('express');
const router = express.Router();
const { handlers } = require('./webhook');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

// Get configuration from environment variables
const BOTBIZ_VERIFY_TOKEN = process.env.BOTBIZ_VERIFY_TOKEN || '8450385012773603920';
const INTERNAL_WEBHOOK_URL = process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:3000/webhook';

// Log configuration on startup
console.log(`BotBiz webhook handler initialized with verify token: ${BOTBIZ_VERIFY_TOKEN.substring(0, 4)}...`);
console.log(`Forwarding to internal webhook URL: ${INTERNAL_WEBHOOK_URL}`);

/**
 * Verify webhook request is from BotBiz
 * @param {string} token - The token from the request
 * @returns {boolean} - Whether the token is valid
 */
function verifyWebhook(token) {
  return token === BOTBIZ_VERIFY_TOKEN;
}

/**
 * GET endpoint for webhook verification
 * BotBiz will call this to verify the webhook
 */
router.get('/', (req, res) => {
  console.log('Received BotBiz webhook verification request');
  
  const token = req.query.token;
  
  if (verifyWebhook(token)) {
    console.log('BotBiz webhook verification successful');
    return res.status(200).send('Webhook verified');
  } else {
    console.error('BotBiz webhook verification failed - invalid token');
    return res.status(403).send('Invalid verification token');
  }
});

/**
 * POST endpoint for incoming messages
 * BotBiz will call this when a message is received
 */
router.post('/', async (req, res) => {
  try {
    // Verify webhook token
    const token = req.query.token;
    if (!verifyWebhook(token)) {
      console.error('Webhook verification failed:', { receivedToken: token });
      return res.status(401).json({ error: 'Invalid verification token' });
    }

    console.log('=== START WEBHOOK PROCESSING ===');
    console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.log('No messages to process in payload');
      return res.json({ 
        success: true, 
        message: 'No messages to process',
        data: { processed: 0, messages: [] }
      });
    }

    let processed = 0;
    const processedMessages = [];

    for (const message of messages) {
      console.log('\n--- Processing Message ---');
      // Extract the sender's phone number and message text
      const senderNumber = message.from;
      const messageText = message.text?.body;

      console.log('Message details:', {
        id: message.id,
        from: senderNumber,
        text: messageText,
        timestamp: message.timestamp
      });

      if (!senderNumber || !messageText) {
        console.log('Skipping message - missing required fields:', { senderNumber, messageText });
        continue;
      }

      try {
        // Parse and handle the message using the webhook handlers
        console.log('Parsing message text:', messageText);
        const parsedMessage = require('../utils/messageParser').parseMessage(messageText);
        console.log('Parsed message result:', parsedMessage);
        
        let response;
        console.log('Processing message type:', parsedMessage.type);
        
        switch (parsedMessage.type) {
          case 'GREETING':
            response = handlers.handleGreeting(senderNumber);
            break;
          case 'HELP':
            response = handlers.handleHelp();
            break;
          case 'PAYMENT':
            console.log('Processing payment with data:', parsedMessage);
            response = await handlers.handlePayment(parsedMessage, senderNumber);
            console.log('Payment processing result:', response);
            break;
          case 'BALANCE_QUERY':
            response = await handlers.handleBalanceQuery(parsedMessage.name, senderNumber);
            break;
          case 'HISTORY_QUERY':
            response = await handlers.handleHistoryQuery(parsedMessage.name, senderNumber);
            break;
          default:
            response = handlers.handleUnclear();
        }

        // Send response back to the user
        const responseMessage = response.responseMessage || response.message;
        console.log('Sending response to user:', responseMessage);
        
        const sendResult = await sendWhatsAppMessage(senderNumber, responseMessage);
        console.log('WhatsApp send result:', sendResult);

        if (sendResult.success) {
          processed++;
          processedMessages.push({
            id: message.id,
            status: 'success',
            response: responseMessage,
            messageId: sendResult.data?.messageId
          });
          console.log('Message processed successfully');
        } else {
          console.error('Failed to send WhatsApp response:', sendResult.error);
          processedMessages.push({
            id: message.id,
            status: 'error',
            error: sendResult.error?.message || 'Failed to send response'
          });
        }

      } catch (error) {
        console.error('Error processing message:', error);
        processedMessages.push({
          id: message.id,
          status: 'error',
          error: error.message
        });
      }
      console.log('--- End Processing Message ---\n');
    }

    console.log(`=== END WEBHOOK PROCESSING (Processed: ${processed}) ===`);
    
    // Send response in BotBiz expected format
    res.json({
      success: true,
      message: `Processed ${processed} messages`,
      data: {
        processed,
        messages: processedMessages
      }
    });

  } catch (error) {
    console.error('Error in BotBiz webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 