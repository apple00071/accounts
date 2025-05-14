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
  // Format 1: "[Amount] received from [Name]" or "[Amount] paid to [Name]"
  // Format 2: "[Name] paid [Amount]" or "[Name] received [Amount]"
  // Format 3: "paid [Amount] to [Name]" or "received [Amount] from [Name]"
  const paymentRegex1 = /^(\d+)(?:\s+)(paid|received|gave|got|sent)(?:\s+(?:to|from)\s+)([a-z\s]+)/i;
  const paymentRegex2 = /([a-z\s]+)(?:\s+)(paid|received|gave|got|sent)(?:\s+)(\d+)/i;
  const paymentRegex3 = /(paid|received|gave|got|sent)(?:\s+)(\d+)(?:\s+(?:to|from)\s+)([a-z\s]+)/i;
  const paymentRegex4 = /^(\d+)(?:\s+)(received|got)(?:\s+from\s+)([a-z\s]+)/i; // For "500 received from Test"
  
  const paymentMatch1 = text.match(paymentRegex1);
  const paymentMatch2 = text.match(paymentRegex2);
  const paymentMatch3 = text.match(paymentRegex3);
  const paymentMatch4 = text.match(paymentRegex4);
  
  if (paymentMatch4) {
    const amount = parseInt(paymentMatch4[1], 10);
    const name = paymentMatch4[3].trim();
    
    return {
      type: 'PAYMENT',
      name,
      amount,
      direction: 'received', // You received money FROM them
      originalMessage: message
    };
  }
  
  if (paymentMatch1) {
    const amount = parseInt(paymentMatch1[1], 10);
    const direction = paymentMatch1[2].toLowerCase();
    const name = paymentMatch1[3].trim();
    
    // Clarify direction based on preposition
    const isReceived = direction === 'received' || direction === 'got' || 
                      (text.includes('from') && !text.includes('to'));
    
    return {
      type: 'PAYMENT',
      name,
      amount,
      direction: isReceived ? 'received' : 'paid',
      originalMessage: message
    };
  }
  
  if (paymentMatch2) {
    const name = paymentMatch2[1].trim();
    const direction = paymentMatch2[2].toLowerCase();
    const amount = parseInt(paymentMatch2[3], 10);
    
    // If "[Name] paid", they paid you (you received)
    const isReceived = direction === 'paid' || direction === 'gave' || direction === 'sent';
    
    return {
      type: 'PAYMENT',
      name,
      amount,
      direction: isReceived ? 'received' : 'paid',
      originalMessage: message
    };
  }

  if (paymentMatch3) {
    const direction = paymentMatch3[1].toLowerCase();
    const amount = parseInt(paymentMatch3[2], 10);
    const name = paymentMatch3[3].trim();
    
    // Clarify direction based on preposition
    const isReceived = direction === 'received' || direction === 'got' || 
                      (text.includes('from') && !text.includes('to'));
    
    return {
      type: 'PAYMENT',
      name,
      amount,
      direction: isReceived ? 'received' : 'paid',
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