/**
 * Message Parser Utility
 * 
 * This utility parses incoming WhatsApp messages and categorizes them
 * into different types based on their content.
 */

/**
 * Parse a message text and categorize it
 * @param {string} message - The message text to parse
 * @returns {Object} Parsed message object with type and relevant data
 */
function parseMessage(message) {
  if (!message || typeof message !== 'string') {
    return { type: 'UNCLEAR', originalMessage: message };
  }

  const text = message.trim().toLowerCase();
  
  // Check for payment-related messages
  // Format: "[Name] paid [Amount]" or "[Name] received [Amount]"
  const paymentRegex = /([a-z\s]+)(?:\s+)(paid|received|gave|got|sent)(?:\s+)(\d+)/i;
  const paymentMatch = text.match(paymentRegex);
  
  if (paymentMatch) {
    const name = paymentMatch[1].trim();
    const direction = paymentMatch[2].toLowerCase();
    const amount = parseInt(paymentMatch[3], 10);
    
    return {
      type: 'PAYMENT',
      name,
      amount,
      direction: direction === 'paid' || direction === 'gave' || direction === 'sent' ? 'paid' : 'received',
      originalMessage: message
    };
  }
  
  // Check for balance queries
  // Format: "[Name] balance" or "balance [Name]" or just "balance"
  if (text.includes('balance')) {
    const balanceRegex = /(balance\s+for\s+)([a-z\s]+)|(balance\s+of\s+)([a-z\s]+)|([a-z\s]+)(\s+balance)/i;
    const balanceMatch = text.match(balanceRegex);
    
    let name = null;
    if (balanceMatch) {
      name = (balanceMatch[2] || balanceMatch[4] || balanceMatch[5] || '').trim();
    }
    
    return {
      type: 'BALANCE_QUERY',
      name: name || null,
      originalMessage: message
    };
  }
  
  // Check for history/transaction queries
  // Format: "[Name] history" or "transactions [Name]" or "history"
  if (text.includes('history') || text.includes('transactions') || text.includes('statement')) {
    const historyRegex = /(history\s+for\s+)([a-z\s]+)|(transactions\s+of\s+)([a-z\s]+)|([a-z\s]+)(\s+history)|([a-z\s]+)(\s+transactions)/i;
    const historyMatch = text.match(historyRegex);
    
    let name = null;
    if (historyMatch) {
      name = (historyMatch[2] || historyMatch[4] || historyMatch[5] || historyMatch[7] || '').trim();
    }
    
    return {
      type: 'HISTORY_QUERY',
      name: name || null, 
      originalMessage: message
    };
  }
  
  // Check for greetings
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'hola', 'namaste'];
  if (greetings.some(greeting => text.includes(greeting))) {
    return {
      type: 'GREETING',
      originalMessage: message
    };
  }
  
  // Check for help requests
  if (text.includes('help') || text === '?' || text.includes('menu') || text.includes('options')) {
    return {
      type: 'HELP',
      originalMessage: message
    };
  }
  
  // Default to unclear if no patterns match
  return {
    type: 'UNCLEAR',
    originalMessage: message
  };
}

module.exports = {
  parseMessage
}; 