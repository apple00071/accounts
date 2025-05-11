/**
 * WhatsApp Provider Utility
 * 
 * This utility handles sending messages to WhatsApp using different providers:
 * - Twilio
 * - 360dialog
 * - Meta (Facebook) - Direct WhatsApp Business API
 * - BotBiz
 */

const axios = require('axios');

// Provider configuration
const providers = {
  botbiz: {
    enabled: process.env.BOTBIZ_ENABLED === 'true',
    apiKey: process.env.BOTBIZ_API_KEY,
    phoneNumber: process.env.BOTBIZ_PHONE_NUMBER,
    verifyToken: process.env.BOTBIZ_VERIFY_TOKEN
  },
  twilio: {
    enabled: process.env.TWILIO_ENABLED === 'true',
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  dialog360: {
    enabled: process.env.DIALOG360_ENABLED === 'true',
    apiKey: process.env.DIALOG360_API_KEY,
    phoneNumberId: process.env.DIALOG360_PHONE_NUMBER_ID
  },
  meta: {
    enabled: process.env.META_ENABLED === 'true',
    appId: process.env.META_APP_ID,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN
  }
};

// Select the active provider based on configuration
const activeProvider = providers.botbiz.enabled ? 'botbiz' :
                       providers.meta.enabled ? 'meta' : 
                       providers.twilio.enabled ? 'twilio' : 
                       providers.dialog360.enabled ? 'dialog360' : 
                       null;

/**
 * Send a message using BotBiz's WhatsApp API
 * @param {string} recipientNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} The API response
 */
async function sendViaBotbiz(recipientNumber, message) {
  try {
    // Format the phone number (remove any '+' prefix)
    const formattedNumber = recipientNumber.replace('+', '');

    // First get CSRF token
    const csrfResponse = await axios.get('https://dash.botbiz.io/sanctum/csrf-cookie', {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Get the CSRF token from cookies
    const csrfToken = decodeURIComponent(
      csrfResponse.headers['set-cookie']
        ?.find(cookie => cookie.startsWith('XSRF-TOKEN='))
        ?.split(';')[0]
        ?.split('=')[1]
    );

    // Get the session cookie
    const sessionCookie = csrfResponse.headers['set-cookie']
      ?.find(cookie => cookie.startsWith('botbiz_session='))
      ?.split(';')[0];

    // Prepare the message payload
    const payload = {
      from: providers.botbiz.phoneNumber, // Our registered BotBiz number
      to: formattedNumber,
      type: 'text',
      text: message
    };

    // Make the API request with CSRF token and session cookie
    const response = await axios.post(
      'https://dash.botbiz.io/v1/messages/send',
      payload,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': csrfToken,
          'Authorization': `Bearer ${process.env.BOTBIZ_API_KEY}`,
          'Cookie': sessionCookie
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending message via BotBiz:', error);
    console.error('BotBiz API error response:', {
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.response?.data || { message: error.message },
      provider: 'botbiz'
    };
  }
}

/**
 * Send a message using Twilio's WhatsApp API
 * @param {string} to - The recipient's phone number (with WhatsApp format)
 * @param {string} message - The message to send
 * @returns {Promise} The API response
 */
async function sendViaTwilio(to, message) {
  try {
    const twilioClient = require('twilio')(
      providers.twilio.accountSid,
      providers.twilio.authToken
    );
    
    const response = await twilioClient.messages.create({
      from: `whatsapp:${providers.twilio.phoneNumber}`,
      body: message,
      to: `whatsapp:${to}`
    });
    
    return {
      success: true,
      messageId: response.sid,
      provider: 'twilio'
    };
  } catch (error) {
    console.error('Error sending message via Twilio:', error);
    throw {
      success: false,
      error: error.message,
      provider: 'twilio'
    };
  }
}

/**
 * Send a message using 360dialog's WhatsApp API
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} The API response
 */
async function sendVia360Dialog(to, message) {
  try {
    // Format the number: remove any '+' and ensure it has country code
    const formattedNumber = to.replace(/^\+/, '');
    
    const response = await axios.post(
      'https://waba.360dialog.io/v1/messages',
      {
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'D360-API-KEY': providers.dialog360.apiKey
        }
      }
    );
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      provider: 'dialog360'
    };
  } catch (error) {
    console.error('Error sending message via 360dialog:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      provider: 'dialog360'
    };
  }
}

/**
 * Send a message using Meta's direct WhatsApp Business API
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} The API response
 */
async function sendViaMeta(to, message) {
  try {
    // Ensure the phone number is in the correct format (remove '+' prefix)
    const formattedNumber = to.replace(/^\+/, '');
    
    // Prepare the API URL for the specific phone number ID
    const apiUrl = `https://graph.facebook.com/v17.0/${providers.meta.phoneNumberId}/messages`;
    
    // Meta WhatsApp API request
    const response = await axios.post(
      apiUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.meta.accessToken}`
        }
      }
    );
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      provider: 'meta'
    };
  } catch (error) {
    console.error('Error sending message via Meta:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      provider: 'meta'
    };
  }
}

/**
 * Send a WhatsApp message using the configured provider
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} The send result
 */
async function sendWhatsAppMessage(to, message) {
  // If no provider is configured, log the message instead
  if (!activeProvider) {
    console.log(`[MOCK] Sending WhatsApp message to ${to}:`);
    console.log(message);
    return {
      success: true,
      provider: 'mock',
      message: 'Message logged to console (no provider configured)'
    };
  }
  
  // Send via the active provider
  try {
    if (activeProvider === 'botbiz') {
      return await sendViaBotbiz(to, message);
    } else if (activeProvider === 'twilio') {
      return await sendViaTwilio(to, message);
    } else if (activeProvider === 'dialog360') {
      return await sendVia360Dialog(to, message);
    } else if (activeProvider === 'meta') {
      return await sendViaMeta(to, message);
    }
  } catch (error) {
    console.error(`Error sending WhatsApp message via ${activeProvider}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      provider: activeProvider
    };
  }
}

/**
 * Check if the number is a valid WhatsApp number
 * (Note: This is a basic validation, real validation would require checking with the WhatsApp API)
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} Whether the number appears valid
 */
function isValidWhatsAppNumber(phoneNumber) {
  // Remove any non-digits
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Basic check: should have 10-15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Format a phone number for WhatsApp
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted number
 */
function formatWhatsAppNumber(phoneNumber) {
  // Remove any non-digits
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has a "+" prefix if it doesn't already
  return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
}

module.exports = {
  sendWhatsAppMessage,
  isValidWhatsAppNumber,
  formatWhatsAppNumber,
  activeProvider
}; 