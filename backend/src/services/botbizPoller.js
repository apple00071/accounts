/**
 * BotBiz Message Polling Service
 * 
 * This service periodically polls the BotBiz API for new messages,
 * processes them through our message handler, and sends responses back.
 */

const axios = require('axios');
const { parseMessage } = require('../utils/messageParser');
const { generateResponse } = require('../utils/responseGenerator');
const botbizConfig = require('../config/botbiz');

// Import the actual handlers from webhook implementation
const { handlers } = require('../routes/webhook');
const {
  handlePayment,
  handleBalanceQuery,
  handleHistoryQuery,
  handleGreeting,
  handleHelp,
  handleUnclear
} = handlers;

// BotBiz API configuration
const BOTBIZ_API_KEY = process.env.BOTBIZ_API_KEY;
const BOTBIZ_PHONE_NUMBER = process.env.BOTBIZ_PHONE_NUMBER;
const POLLING_INTERVAL = botbizConfig.pollingInterval;

// Track the last message timestamp to avoid processing duplicates
let lastMessageTimestamp = new Date().toISOString();

/**
 * Initialize the BotBiz polling service
 */
function initBotbizPoller() {
  console.log('Starting BotBiz polling service...');
  console.log(`Polling interval: ${POLLING_INTERVAL}ms`);
  console.log(`BotBiz phone number: ${BOTBIZ_PHONE_NUMBER}`);
  
  // Start polling immediately
  pollMessages();
  
  // Then schedule regular polling
  setInterval(pollMessages, POLLING_INTERVAL);
}

/**
 * Poll the BotBiz API for new messages
 */
async function pollMessages() {
  try {
    if (botbizConfig.logging.enabled) {
      console.log('Polling BotBiz API for new messages...');
    }
    
    // Make API request to get new messages
    const response = await axios.get(
      `${botbizConfig.baseUrl}${botbizConfig.endpoints.messages}`, 
      {
        headers: botbizConfig.getHeaders(BOTBIZ_API_KEY),
        params: {
          after: lastMessageTimestamp,
          limit: 50
        }
      }
    );
    
    // Process new messages if any
    const messages = response.data.messages || [];
    
    if (messages.length > 0) {
      console.log(`Received ${messages.length} new messages from BotBiz API`);
      
      // Update the last message timestamp
      if (messages[0].timestamp) {
        lastMessageTimestamp = messages[0].timestamp;
      }
      
      // Process each message
      for (const message of messages) {
        await processMessage(message);
      }
    } else if (botbizConfig.logging.enabled && botbizConfig.logging.level === 'debug') {
      console.log('No new messages');
    }
  } catch (error) {
    console.error('Error polling BotBiz API:', error.message);
    
    if (error.response) {
      console.error('API error:', error.response.status, error.response.data);
    }
  }
}

/**
 * Process a single message from BotBiz
 * @param {Object} message - The message object from BotBiz API
 */
async function processMessage(message) {
  try {
    // Extract relevant data
    const sender = message.from;
    const text = message.text;
    
    console.log(`Processing message from ${sender}: "${text}"`);
    
    // Parse the message using our existing parser
    const parsedMessage = parseMessage(text);
    console.log('Parsed message:', JSON.stringify(parsedMessage, null, 2));
    
    // Handle different message types
    let response;
    
    switch (parsedMessage.type) {
      case 'PAYMENT':
        // Process payment message
        response = await handlePayment(parsedMessage, sender);
        break;
      case 'BALANCE_QUERY':
        // Process balance query
        response = await handleBalanceQuery(parsedMessage.name, sender);
        break;
      case 'HISTORY_QUERY':
        // Process history query
        response = await handleHistoryQuery(parsedMessage.name, sender);
        break;
      case 'GREETING':
        response = handleGreeting(sender);
        break;
      case 'HELP':
        response = handleHelp();
        break;
      case 'UNCLEAR':
      default:
        response = handleUnclear();
    }
    
    // Send response back to the user
    if (response && (response.message || response.responseMessage)) {
      const messageToSend = response.responseMessage || response.message;
      await sendResponseToUser(sender, messageToSend);
    }
  } catch (error) {
    console.error(`Error processing message: ${error.message}`);
  }
}

/**
 * Send a response back to the user via BotBiz API
 * @param {string} recipient - The recipient's phone number
 * @param {string} message - The message to send
 */
async function sendResponseToUser(recipient, message) {
  try {
    console.log(`Sending response to ${recipient}: "${message}"`);
    
    // Send message via BotBiz API
    await axios.post(
      `${botbizConfig.baseUrl}${botbizConfig.endpoints.send}`, 
      {
        phone: recipient.replace(/^\+/, ''), // Remove '+' if present
        message,
        type: botbizConfig.messageFormats.text
      }, 
      {
        headers: botbizConfig.getHeaders(BOTBIZ_API_KEY)
      }
    );
    
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error sending response:', error.message);
    
    if (error.response) {
      console.error('API error:', error.response.status, error.response.data);
    }
  }
}

module.exports = {
  initBotbizPoller
}; 