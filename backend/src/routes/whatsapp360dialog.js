/**
 * 360Dialog WhatsApp Integration Route
 * 
 * This route handles incoming webhooks from the 360dialog WhatsApp Business API.
 * It extracts message data and forwards it to our main webhook processing logic.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

// Middleware to verify 360dialog webhook signature (implement when needed)
const verify360DialogSignature = (req, res, next) => {
  // In production, you'd verify the request came from 360dialog
  // using their signature mechanism
  next();
};

// Extract phone number from 360dialog format
function extractPhoneNumber(number) {
  // 360dialog uses format like "1234567890@c.us"
  return number.split('@')[0];
}

// Process and transform 360dialog webhook data
router.post('/', verify360DialogSignature, async (req, res) => {
  try {
    // Acknowledge receipt immediately to 360dialog
    res.status(200).send();
    
    const data = req.body;
    
    // Check if this is a WhatsApp text message
    if (!data.messages || !data.messages.length) {
      console.log('No messages in webhook payload');
      return;
    }
    
    // Process each message (usually just one)
    for (const message of data.messages) {
      // Only process text messages for now
      if (message.type !== 'text' || !message.text || !message.text.body) {
        console.log(`Skipping non-text message of type: ${message.type}`);
        continue;
      }
      
      const text = message.text.body;
      const from = extractPhoneNumber(message.from);
      
      console.log(`Received message from ${from}: ${text}`);
      
      // Forward to our internal webhook handler
      try {
        // Call our main webhook endpoint directly
        const response = await axios.post(
          process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:5000/api/webhook',
          { from, text }
        );
        
        console.log('Message processed successfully');
      } catch (error) {
        console.error('Error forwarding to internal webhook:', error.message);
        
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
  } catch (error) {
    console.error('Error processing 360dialog webhook:', error);
    // We've already sent a 200 response to 360dialog
  }
});

module.exports = router; 