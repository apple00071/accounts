/**
 * Meta (Facebook) WhatsApp Integration Route
 * 
 * This route handles incoming webhooks from the Meta WhatsApp Business API.
 * It extracts message data and forwards it to our main webhook processing logic.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

// Verify the webhook signature from Meta
const verifyMetaWebhook = (req, res, next) => {
  // Verify this is a real webhook call from Meta
  // https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Verification endpoint
  if (mode && token) {
    // Check the mode and token
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      // Respond with the challenge token to confirm
      console.log('META WEBHOOK VERIFIED');
      return res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      return res.sendStatus(403);
    }
  }
  
  // If it's a regular webhook call (not verification), proceed
  next();
};

// Extract phone number from Meta format
function extractPhoneNumber(number) {
  // Clean the number by removing any non-digits
  return number.replace(/\D/g, '');
}

// Process Meta webhook data
router.get('/', verifyMetaWebhook, (req, res) => {
  // This endpoint only handles verification, which is taken care of in the middleware
  res.sendStatus(200);
});

router.post('/', async (req, res) => {
  try {
    // Acknowledge receipt immediately to Meta
    res.status(200).send('EVENT_RECEIVED');
    
    const data = req.body;
    
    // Enhanced logging for debugging
    console.log('==================== META WEBHOOK RECEIVED ====================');
    console.log('Webhook payload:', JSON.stringify(data, null, 2));
    console.log('==============================================================');

    // Check if this is a WhatsApp message
    if (!data.object || data.object !== 'whatsapp_business_account') {
      console.log('Not a WhatsApp Business webhook - Object value:', data.object);
      return;
    }
    
    // Process each entry (usually just one)
    for (const entry of data.entry || []) {
      console.log('Processing entry ID:', entry.id);
      
      // Process each change in the entry
      for (const change of entry.changes || []) {
        console.log('Processing change - Field:', change.field);
        
        // Only process value changes for messages
        if (change.field !== 'messages') {
          console.log('Skipping non-message field:', change.field);
          continue;
        }
        
        const value = change.value;
        console.log('Change value:', JSON.stringify(value, null, 2));
        
        // Process only if there are messages
        if (!value.messages || !value.messages.length) {
          console.log('No messages in webhook value');
          continue;
        }
        
        // Process each message
        for (const message of value.messages) {
          console.log('Processing message ID:', message.id);
          
          // Only process text messages for now
          if (message.type !== 'text' || !message.text || !message.text.body) {
            console.log(`Skipping non-text message of type: ${message.type}`);
            continue;
          }
          
          const text = message.text.body;
          const from = extractPhoneNumber(message.from);
          
          console.log(`Received message from ${from}: "${text}"`);
          
          // Forward to our internal webhook handler
          try {
            console.log('Forwarding to internal webhook:', process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:5000/api/webhook');
            
            // Call our main webhook endpoint directly
            const response = await axios.post(
              process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:5000/api/webhook',
              { from, text }
            );
            
            console.log('Message processed successfully. Response:', JSON.stringify(response.data, null, 2));
          } catch (error) {
            console.error('Error forwarding to internal webhook:', error.message);
            console.error('Full error:', error);
            
            // Send a fallback message to the user
            try {
              await sendWhatsAppMessage(
                from, 
                "I'm having trouble processing your message right now. Please try again later."
              );
            } catch (sendError) {
              console.error('Failed to send fallback message:', sendError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing Meta webhook:', error);
    // We've already sent a 200 response to Meta
  }
});

module.exports = router; 