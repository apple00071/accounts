/**
 * Webhook Test Script
 * 
 * This script tests the webhook endpoint directly by sending a test message.
 * This helps diagnose issues with the webhook processing logic.
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const readline = require('readline');

// Configuration
const webhookUrl = process.env.INTERNAL_WEBHOOK_URL || 'http://localhost:3000/api/webhook';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for phone number and message
rl.question('Enter phone number (with country code): ', (phoneNumber) => {
  rl.question('Enter test message: ', async (message) => {
    await testWebhook(phoneNumber, message);
    rl.close();
  });
});

/**
 * Test the webhook directly
 * @param {string} phoneNumber - The phone number to use as sender
 * @param {string} message - The message to send
 */
async function testWebhook(phoneNumber, message) {
  console.log(`\nSending test to webhook at ${webhookUrl}`);
  console.log(`From: ${phoneNumber}`);
  console.log(`Message: "${message}"`);
  
  try {
    // Format the request as expected by the webhook
    const webhookData = {
      from: phoneNumber,
      text: message
    };
    
    console.log('\nWebhook request payload:', JSON.stringify(webhookData, null, 2));
    
    // Send the request to the webhook
    const response = await axios.post(webhookUrl, webhookData);
    
    console.log('\n✅ Webhook responded successfully!');
    console.log('Status Code:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if WhatsApp delivery was attempted
    if (response.data.whatsappDelivery) {
      if (response.data.whatsappDelivery.success) {
        console.log('\n✅ Message was successfully sent via WhatsApp');
        console.log('Message ID:', response.data.whatsappDelivery.messageId);
        console.log('Provider:', response.data.whatsappDelivery.provider);
      } else {
        console.log('\n❌ WhatsApp delivery failed:');
        console.log(response.data.whatsappDelivery.error);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error testing webhook:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your server is running');
    console.log('2. Check that the webhook URL is correct');
    console.log('3. Ensure there are no network/firewall issues');
  }
} 