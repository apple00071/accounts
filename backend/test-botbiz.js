/**
 * BotBiz Integration Test Tool
 * 
 * This script tests the BotBiz integration by simulating inbound messages
 * and testing the message response flow.
 * 
 * Run this script with: node test-botbiz.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const { parseMessage } = require('./src/utils/messageParser');
const botbizConfig = require('./src/config/botbiz');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// BotBiz configuration from environment
const BOTBIZ_API_KEY = process.env.BOTBIZ_API_KEY;
const BOTBIZ_PHONE_NUMBER = process.env.BOTBIZ_PHONE_NUMBER;

// Test options
const USE_WEBHOOK = process.argv.includes('--webhook');
const TEST_PHONE = process.argv.includes('--phone') 
  ? process.argv[process.argv.indexOf('--phone') + 1] 
  : '+1234567890'; // Default test phone number

// Print configuration
console.log('====== BotBiz Integration Test Tool ======');
console.log(`Mode: ${USE_WEBHOOK ? 'Webhook' : 'API Polling'}`);
console.log(`BotBiz Phone: ${BOTBIZ_PHONE_NUMBER}`);
console.log(`Test Sender: ${TEST_PHONE}`);
console.log('=========================================\n');

/**
 * Test webhook by sending a direct POST request
 */
async function testWebhook(message) {
  try {
    console.log(`\nSending webhook request to: http://localhost:3000/api/whatsapp/botbiz`);
    console.log(`Message: "${message}" from ${TEST_PHONE}`);
    
    const response = await axios.post('http://localhost:3000/api/whatsapp/botbiz', {
      from: TEST_PHONE,
      text: message,
      // Add other fields that BotBiz would typically send
      timestamp: new Date().toISOString(),
      type: 'text'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Webhook response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('\n❌ Webhook error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    
    return null;
  }
}

/**
 * Test the BotBiz API directly by sending a message
 */
async function testApiDirect(message) {
  try {
    // First, simulate adding the message to the BotBiz API
    console.log(`\nSimulating message in BotBiz API: "${message}" from ${TEST_PHONE}`);
    
    // Preview the message parsing
    const parsedMessage = parseMessage(message);
    console.log('\nMessage would be parsed as:');
    console.log(JSON.stringify(parsedMessage, null, 2));
    
    // Ask user if they want to send a real message using the BotBiz API
    rl.question('\nDo you want to send a real message to BotBiz API? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          console.log(`\nSending message to BotBiz API...`);
          
          // Use the actual send endpoint to send a message (this is usually for outbound messages)
          const response = await axios.post(
            `${botbizConfig.baseUrl}${botbizConfig.endpoints.send}`,
            {
              phone: BOTBIZ_PHONE_NUMBER.replace(/^\+/, ''),
              message: `TEST: ${message}`,
              type: 'text'
            },
            {
              headers: botbizConfig.getHeaders(BOTBIZ_API_KEY)
            }
          );
          
          console.log('\n✅ BotBiz API response:');
          console.log(JSON.stringify(response.data, null, 2));
          
          console.log('\nNOTE: Your polling service should pick up the response from BotBiz within the polling interval.');
        } catch (error) {
          console.error('\n❌ BotBiz API error:');
          if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(JSON.stringify(error.response.data, null, 2));
          } else {
            console.error(error.message);
          }
        }
      }
      
      // Ask for another message or exit
      promptForAnotherMessage();
    });
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);
    promptForAnotherMessage();
  }
}

/**
 * Prompt the user for a message to send
 */
function promptForMessage() {
  rl.question('\nEnter a message to send (or "exit" to quit): ', async (message) => {
    if (message.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    if (USE_WEBHOOK) {
      await testWebhook(message);
      promptForAnotherMessage();
    } else {
      await testApiDirect(message);
    }
  });
}

/**
 * Prompt the user to send another message or exit
 */
function promptForAnotherMessage() {
  rl.question('\nTest another message? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      promptForMessage();
    } else {
      rl.close();
    }
  });
}

// Show usage instructions
console.log('Send test messages to your WhatsApp Accounting application.');
console.log('Examples:');
console.log('- "Kumar paid 5000"');
console.log('- "balance for Kumar"');
console.log('- "show transactions for Kumar"');
console.log('- "help"\n');

// Start the test
promptForMessage();

// Handle close
rl.on('close', () => {
  console.log('\nBotBiz test completed. Goodbye!');
  process.exit(0);
}); 