/**
 * Simple test script for WhatsApp message processing
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const { parseMessage } = require('./src/utils/messageParser');
const { handlers } = require('./src/routes/webhook');

// The message we want to test
const testMessage = "Kumar paid 2000";
const phoneNumber = process.env.BOTBIZ_PHONE_NUMBER || "919177197474";

// Test messages
const messages = [
  "500090 received from Test",
  "25000 received from Kumar",
  "paid 5000 to Kumar",
  "Kumar paid 2000",
  "received 1000 from Pavan"
];

console.log("Testing message parser...\n");

messages.forEach(message => {
  console.log(`Input: "${message}"`);
  const result = parseMessage(message);
  console.log("Parsed result:", JSON.stringify(result, null, 2));
  console.log("---\n");
});

// Simulate sending a message directly to the webhook
async function testWebhook() {
  // Test user's phone number (different from BotBiz number)
  const userPhoneNumber = '919876543210';
  
  // Test messages
  const messages = [
    '25000 received from Kumar',
    'paid 5000 to Kumar',
    '25000 received from Pavan'
  ];

  console.log('=== Testing WhatsApp Payment Messages ===\n');

  for (const messageText of messages) {
    console.log(`Testing message: "${messageText}"`);
    
    try {
      // Parse the message
      const parsedMessage = parseMessage(messageText);
      console.log('\nParsed message:', parsedMessage);

      // Process the payment
      const result = await handlers.handlePayment(parsedMessage, userPhoneNumber);
      console.log('\nResult:', result);
      
      if (result.error) {
        console.log('\n❌ Error:', result.error);
      } else {
        console.log('\n✅ Success! Response:', result.message);
      }
    } catch (error) {
      console.error('\n❌ Error processing message:', error);
    }
    
    console.log('\n-------------------\n');
  }

  console.log('Test completed!');
}

// Run the test
testWebhook().catch(console.error); 