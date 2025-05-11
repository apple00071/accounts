/**
 * WhatsApp Chatbot Testing Utility
 * 
 * This utility helps test the WhatsApp chatbot functionality
 * by simulating incoming messages and displaying responses.
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000/webhook',
  phoneNumber: process.env.TEST_PHONE || '+919876543210',
  userName: process.env.TEST_NAME || 'Test User'
};

// Create readline interface for CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Send a test message to the webhook endpoint
 * @param {string} text - The message text to send
 */
async function sendTestMessage(text) {
  try {
    console.log(`\n📱 Sending: "${text}"`);
    
    const response = await axios.post(config.apiUrl, {
      from: config.phoneNumber,
      text: text
    });
    
    // Display the response
    console.log('\n🤖 Bot response:');
    console.log(`${response.data.messageToSend || response.data.message || 'No response'}`);
    
    // If there was an error, show it
    if (response.data.error) {
      console.log(`\n⚠️ Error: ${response.data.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error sending message:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

/**
 * Start an interactive test session
 */
function startInteractiveSession() {
  console.log('\n=== WhatsApp Accounting Chatbot Tester ===');
  console.log(`Phone number: ${config.phoneNumber}`);
  console.log('Type messages to test or use one of these commands:');
  console.log('  :quit - Exit the test session');
  console.log('  :examples - Show example messages');
  console.log('  :config - Show current configuration');
  console.log('===========================================\n');
  
  promptUser();
}

/**
 * Show example messages that can be tested
 */
function showExampleMessages() {
  console.log('\n--- Example Messages ---');
  console.log('1. Greetings:');
  console.log('   - "Hello"');
  console.log('   - "Hi there"');
  
  console.log('\n2. Help:');
  console.log('   - "Help"');
  console.log('   - "What can you do?"');
  
  console.log('\n3. Recording Payments:');
  console.log('   - "Received 500 from Rahul"');
  console.log('   - "Paid 1000 to Priya via UPI"');
  console.log('   - "Got 2500 from Jay on 15th June for rent"');
  
  console.log('\n4. Checking Balance:');
  console.log('   - "Balance for Rahul"');
  console.log('   - "What\'s my balance?"');
  
  console.log('\n5. Viewing History:');
  console.log('   - "Show transactions for Priya"');
  console.log('   - "Show my history"');
  console.log('------------------------\n');
}

/**
 * Prompt the user for input
 */
function promptUser() {
  rl.question('➤ Enter message: ', async (input) => {
    if (input.trim().toLowerCase() === ':quit') {
      console.log('\nExiting test session. Goodbye!');
      rl.close();
      return;
    }
    
    if (input.trim().toLowerCase() === ':examples') {
      showExampleMessages();
      promptUser();
      return;
    }
    
    if (input.trim().toLowerCase() === ':config') {
      console.log('\nCurrent configuration:');
      console.log(`API URL: ${config.apiUrl}`);
      console.log(`Phone number: ${config.phoneNumber}`);
      console.log(`User name: ${config.userName}\n`);
      promptUser();
      return;
    }
    
    if (input.trim()) {
      await sendTestMessage(input);
    }
    
    promptUser();
  });
}

// Run the testing utility if executed directly
if (require.main === module) {
  startInteractiveSession();
}

module.exports = {
  sendTestMessage,
  startInteractiveSession
}; 