const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppMessage } = require('../utils/whatsappProvider');

const prisma = new PrismaClient();

// Get WhatsApp settings
router.get('/whatsapp', async (req, res) => {
  try {
    // In a real app, you would retrieve these from a database
    // For now, we'll return the environment variables if they exist
    // (with sensitive data partially masked)
    
    const botbizApiKey = process.env.BOTBIZ_API_KEY || '';
    const botbizPhoneNumber = process.env.BOTBIZ_PHONE_NUMBER || '';
    const botbizVerifyToken = process.env.BOTBIZ_VERIFY_TOKEN || '';
    
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    
    const dialogApiKey = process.env.DIALOG360_API_KEY || '';
    const dialogPhoneNumberId = process.env.DIALOG360_PHONE_NUMBER_ID || '';
    
    const metaAppId = process.env.META_APP_ID || '';
    const metaAppSecret = process.env.META_APP_SECRET || '';
    const metaPhoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    const metaAccessToken = process.env.META_ACCESS_TOKEN || '';
    const metaWebhookVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';
    
    // Return settings with masked sensitive data
    res.json({
      botbiz: {
        apiKey: maskSensitiveData(botbizApiKey),
        phoneNumber: botbizPhoneNumber,
        verifyToken: maskSensitiveData(botbizVerifyToken),
        enabled: Boolean(process.env.BOTBIZ_ENABLED === 'true')
      },
      twilio: {
        accountSid: maskSensitiveData(twilioAccountSid),
        authToken: maskSensitiveData(twilioAuthToken),
        phoneNumber: twilioPhoneNumber,
        enabled: Boolean(process.env.TWILIO_ENABLED === 'true')
      },
      threeSixtyDialog: {
        apiKey: maskSensitiveData(dialogApiKey),
        phoneNumberId: dialogPhoneNumberId,
        enabled: Boolean(process.env.DIALOG360_ENABLED === 'true')
      },
      meta: {
        appId: maskSensitiveData(metaAppId),
        appSecret: maskSensitiveData(metaAppSecret),
        phoneNumberId: metaPhoneNumberId,
        accessToken: maskSensitiveData(metaAccessToken),
        webhookVerifyToken: maskSensitiveData(metaWebhookVerifyToken),
        enabled: Boolean(process.env.META_ENABLED === 'true')
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error);
    res.status(500).json({ message: 'Failed to fetch WhatsApp settings' });
  }
});

// Save WhatsApp settings
router.post('/whatsapp', async (req, res) => {
  try {
    const { provider, data } = req.body;
    
    if (!provider || !data) {
      return res.status(400).json({ message: 'Provider and data are required' });
    }
    
    // In a real app, you would save these to a database
    // For now, we'll log them (you could also save to .env file or use a config service)
    console.log(`Saving ${provider} WhatsApp settings`);
    
    // Simulate saving by pausing for a second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return success
    res.json({ 
      message: 'Settings saved successfully',
      provider
    });
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
    res.status(500).json({ message: 'Failed to save WhatsApp settings' });
  }
});

// Test WhatsApp connection
router.post('/whatsapp/test', async (req, res) => {
  try {
    const { provider, phoneNumber } = req.body;
    
    if (!provider) {
      return res.status(400).json({ message: 'Provider is required' });
    }
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Send a test message
    const message = "🔄 Test message from WhatsApp Accounting. If you're receiving this, your integration is working correctly! ✅";
    
    const result = await sendWhatsAppMessage(phoneNumber, message);
    
    res.json({ 
      message: 'Test message sent successfully',
      provider,
      result
    });
  } catch (error) {
    console.error('Error testing WhatsApp:', error);
    res.status(500).json({ 
      message: 'Failed to send test message',
      error: error.message
    });
  }
});

// Helper function to mask sensitive data
function maskSensitiveData(data) {
  if (!data) return '';
  
  // Show only first 4 and last 4 characters
  if (data.length <= 8) {
    return '*'.repeat(data.length);
  }
  
  const firstFour = data.substring(0, 4);
  const lastFour = data.substring(data.length - 4);
  const masked = '*'.repeat(data.length - 8);
  
  return `${firstFour}${masked}${lastFour}`;
}

module.exports = router; 