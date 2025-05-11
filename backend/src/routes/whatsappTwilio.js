/**
 * Twilio WhatsApp Integration Route
 * 
 * This route handles incoming webhooks from the Twilio WhatsApp API.
 * It extracts message data and forwards it to our main webhook processing logic.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { URLSearchParams } = require('url');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

// Middleware to verify request is from Twilio (implement when needed)
const verifyTwilioRequest = (req, res, next) => {
  // In production, you'd verify the request came from Twilio
  // using their signature validation
  next();
};

// Clean phone number by removing the "whatsapp:" prefix that Twilio uses
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Twilio uses format like "whatsapp:+1234567890"
  return phoneNumber.replace('whatsapp:', '').replace('+', '');
}

// Generate a TwiML response
function generateTwimlResponse(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
}

// Process and transform Twilio webhook data
router.post('/', verifyTwilioRequest, async (req, res) => {
  try {
    // Extract message details from Twilio's request format
    const from = cleanPhoneNumber(req.body.From);
    const text = req.body.Body || '';
    
    console.log(`Received WhatsApp message from ${from}: ${text}`);
    
    // Process synchronously because Twilio expects a TwiML response
    try {
      // Forward to our internal webhook handler
      const response = await axios.post(
        process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:5000/api/webhook',
        { from, text }
      );
      
      // Extract the message that was sent back to the user
      const responseMessage = response.data?.messageToSend || 
        "Thank you for your message. We'll get back to you soon.";
      
      // Respond to Twilio with TwiML
      res.set('Content-Type', 'text/xml');
      res.send(generateTwimlResponse(responseMessage));
      
      console.log('Message processed successfully');
    } catch (error) {
      console.error('Error forwarding to internal webhook:', error.message);
      
      // Handle error by sending a fallback TwiML response
      const fallbackMessage = "I'm having trouble processing your message right now. Please try again later.";
      res.set('Content-Type', 'text/xml');
      res.send(generateTwimlResponse(fallbackMessage));
      
      // Also try to send via our provider as a backup
      try {
        await sendWhatsAppMessage(from, fallbackMessage);
      } catch (sendError) {
        console.error('Failed to send fallback message:', sendError);
      }
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
    // Send a fallback TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(generateTwimlResponse("Sorry, something went wrong. Please try again later."));
  }
});

module.exports = router; 