/**
 * Meta WhatsApp Integration Test Script
 * 
 * This script tests the Meta WhatsApp integration by sending a test message
 * using the configured Meta credentials.
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');

// Configuration from environment variables
const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
const accessToken = process.env.META_ACCESS_TOKEN;

// Test recipient phone number (you'll need to enter this when running the script)
let recipientNumber = '';

// Check if Meta credentials are configured
if (!phoneNumberId || !accessToken) {
  console.error('Error: META_PHONE_NUMBER_ID and META_ACCESS_TOKEN must be configured in .env file');
  process.exit(1);
}

// Get recipient number from command line arguments
if (process.argv.length > 2) {
  recipientNumber = process.argv[2].replace(/^\+/, ''); // Remove + if present
} else {
  // Prompt for a phone number if not provided as argument
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Enter recipient phone number (with country code, no + symbol): ', (number) => {
    recipientNumber = number.replace(/^\+/, '');
    readline.close();
    sendTestMessage(recipientNumber);
  });
  
  // Exit the script here to prevent the rest from executing before receiving input
  return;
}

// If we got the number from command line, proceed directly
if (recipientNumber) {
  sendTestMessage(recipientNumber);
}

/**
 * Send a test message via Meta WhatsApp API
 * @param {string} to - The recipient's phone number
 */
async function sendTestMessage(to) {
  console.log(`Sending test message to ${to}...`);
  
  try {
    // Prepare the API URL
    const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    // Test message
    const message = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        body: '🔄 Test message from WhatsApp Accounting. This confirms your Meta WhatsApp integration is working correctly! ✅'
      }
    };
    
    // Send request
    const response = await axios.post(apiUrl, message, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('\n✅ Success! Test message sent successfully.');
    console.log('Message ID:', response.data.messages[0].id);
    console.log('\nNote: Make sure the recipient number has opted in to receive messages from your WhatsApp Business Account.');
    
  } catch (error) {
    console.error('\n❌ Error sending message:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your META_PHONE_NUMBER_ID and META_ACCESS_TOKEN are correct');
    console.log('2. Ensure the recipient number has opted in to your WhatsApp Business Account');
    console.log('3. Check that your WhatsApp Business Account is active and approved');
  }
} 