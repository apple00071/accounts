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
  // First remove "whatsapp:" prefix if present
  let cleaned = phoneNumber.replace('whatsapp:', '');
  
  // Ensure it starts with "+"
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

// Format phone number for Twilio WhatsApp
function formatWhatsAppNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Ensure it has "+" prefix
  let formatted = phoneNumber;
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  // Add "whatsapp:" prefix if not present
  if (!formatted.startsWith('whatsapp:')) {
    formatted = 'whatsapp:' + formatted;
  }
  
  return formatted;
}

// Generate a TwiML response
function generateTwimlResponse(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
}

// Process and transform Twilio webhook data
router.post('/', express.urlencoded({ extended: true }), verifyTwilioRequest, async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log('Received Twilio webhook payload:', req.body);
    
    // Extract message details from Twilio's request format
    // Remove 'whatsapp:' prefix and ensure proper format
    const rawFrom = req.body.From || '';
    const from = rawFrom.replace('whatsapp:', '').replace(/^\+/, '');
    const text = req.body.Body || '';
    
    if (!from) {
      console.error('No sender phone number found in request');
      res.set('Content-Type', 'text/xml');
      res.send(generateTwimlResponse('Error: No sender phone number'));
      return;
    }
    
    console.log(`Received WhatsApp message from +${from}: ${text}`);
    
    try {
      // Forward to our internal webhook handler
      const response = await axios.post(
        process.env.INTERNAL_WEBHOOK_URL,
        { from: `+${from}`, text }
      );
      
      // Extract the message from the response
      // The webhook returns { success: true, message: "..." } or { message: "..." }
      let responseMessage;
      if (response.data && (response.data.message || response.data.messageToSend)) {
        responseMessage = response.data.message || response.data.messageToSend;
      } else if (typeof response.data === 'string') {
        responseMessage = response.data;
      } else {
        responseMessage = "Thank you for your message. We'll get back to you soon.";
      }

      console.log('Response to be sent:', responseMessage);
      
      // Generate and send TwiML response
      const twiml = generateTwimlResponse(responseMessage);
      console.log('Generated TwiML:', twiml);
      
      res.set('Content-Type', 'text/xml');
      res.send(twiml);
      
      console.log('Message processed successfully');
    } catch (error) {
      console.error('Error forwarding to internal webhook:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Handle error with TwiML response
      const fallbackMessage = "I'm having trouble processing your message right now. Please try again later.";
      res.set('Content-Type', 'text/xml');
      res.send(generateTwimlResponse(fallbackMessage));
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
    // Send a fallback TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(generateTwimlResponse("Sorry, something went wrong. Please try again later."));
  }
});

module.exports = router; 