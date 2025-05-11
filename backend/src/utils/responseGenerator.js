/**
 * Response Generator Utility
 * 
 * This utility generates appropriate responses for different message types
 * received through WhatsApp.
 */

/**
 * Generate a response based on the message type
 * @param {string} type - The type of message to generate a response for
 * @param {Object} data - Additional data needed for the response
 * @returns {string} The generated response message
 */
function generateResponse(type, data = {}) {
  switch (type) {
    case 'greeting':
      return `👋 Hello! Welcome to WhatsApp Accounting. How can I help you today? You can record payments, check balances, or view transaction history.`;
      
    case 'help':
      return `📖 *WhatsApp Accounting Help*\n\n` +
        `Here's how you can use this service:\n\n` +
        `*Record a payment*:\n` +
        `- "[Name] paid [Amount]"\n` +
        `- "[Name] received [Amount]"\n\n` +
        `*Check balance*:\n` +
        `- "Balance for [Name]"\n` +
        `- "[Name] balance"\n\n` +
        `*View transactions*:\n` +
        `- "History for [Name]"\n` +
        `- "[Name] transactions"\n\n` +
        `Need more help? Just ask!`;
        
    case 'unclear':
      return `I'm sorry, I didn't understand that message. Type 'help' to see what I can do.`;
      
    case 'payment_success':
      return `✅ Transaction recorded successfully!\n\n` +
        `${data.name} ${data.direction === 'paid' ? 'paid' : 'received'} ${data.amount}\n` +
        `Current balance: ${data.balance || 'Updated'}`;
        
    case 'payment_failure':
      return `❌ Sorry, I couldn't record that payment. Please try again or use a different format.`;
        
    case 'balance':
      if (!data.name) {
        return `Please specify whose balance you want to check.`;
      }
      return `💰 *Balance for ${data.name}*: ${data.balance || 0}`;
        
    case 'history':
      if (!data.name) {
        return `Please specify whose transaction history you want to view.`;
      }
      
      if (!data.transactions || data.transactions.length === 0) {
        return `No transactions found for ${data.name}.`;
      }
      
      let historyMessage = `📊 *Transaction History for ${data.name}*\n\n`;
      
      data.transactions.forEach((transaction, index) => {
        historyMessage += `${index + 1}. ${transaction.date}: ` +
          `${transaction.direction === 'paid' ? 'Paid' : 'Received'} ${transaction.amount}\n`;
      });
      
      return historyMessage;
        
    case 'error':
      return `❌ An error occurred: ${data.message || 'Unknown error'}. Please try again later.`;
        
    default:
      return `I'm not sure how to respond to that. Type 'help' to see what I can do.`;
  }
}

module.exports = {
  generateResponse
}; 