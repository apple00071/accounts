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
      return res.status(401).json({ error: 'Invalid verification token' });
    }

    console.log('Received BotBiz webhook payload');
    console.log('BotBiz webhook data:', JSON.stringify(req.body, null, 2));

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: true, processed: 0, messages: [] });
    }

    let processed = 0;
    const processedMessages = [];

    for (const message of messages) {
      // Extract the sender's phone number and message text
      // Note: In webhook, 'to' field is actually the sender's number
      const senderNumber = message.to; // BotBiz sends the sender's number in 'to' field
      const messageText = message.text?.body;

      if (!senderNumber || !messageText) {
        console.log('Skipping message - missing required fields');
        continue;
      }

      try {
        // Parse and handle the message using the webhook handlers
        const parsedMessage = require('../utils/messageParser').parseMessage(messageText);
        
        let response;
        switch (parsedMessage.type) {
          case 'GREETING':
            response = handlers.handleGreeting(senderNumber);
            break;
          case 'HELP':
            response = handlers.handleHelp();
            break;
          case 'PAYMENT':
            response = await handlers.handlePayment(parsedMessage, senderNumber);
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
        await sendWhatsAppMessage(senderNumber, responseMessage);

        processed++;
        processedMessages.push({
          id: message.id,
          status: 'processed',
          response: responseMessage
        });

        console.log(`Successfully processed message from ${senderNumber}`);
      } catch (error) {
        console.error(`Error processing message from ${senderNumber}:`, error);
        processedMessages.push({
          id: message.id,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      processed,
      messages: processedMessages
    });
  } catch (error) {
    console.error('Error processing BotBiz webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router; 