/**
 * WhatsApp Chatbot Tester Script
 * 
 * This script runs the WhatsApp chatbot tester utility
 * to simulate conversations and test functionality.
 */

// Load environment variables
require('dotenv').config();

// Import the testing utility
const { startInteractiveSession } = require('./src/utils/testWhatsApp');

// Start the interactive testing session
startInteractiveSession(); 