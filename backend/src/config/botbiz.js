/**
 * BotBiz API Configuration
 * 
 * This file contains the configuration for the BotBiz API integration,
 * including endpoints, authentication, and default settings.
 */

module.exports = {
  // Base API URL
  baseUrl: 'https://api.botbiz.io',
  
  // API Endpoints
  endpoints: {
    send: '/api/v1/messages/send',
    messages: '/api/v1/messages/list'
  },
  
  // Default headers
  getHeaders: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }),
  
  // Webhook configuration
  webhook: {
    verifyToken: process.env.BOTBIZ_VERIFY_TOKEN || '8450385012773603920',
    path: '/webhook/whatsapp-webhook'
  },
  
  // Message format options
  messageFormats: {
    text: 'text',
    image: 'image',
    document: 'document',
    audio: 'audio',
    video: 'video',
    location: 'location'
  },
  
  // Polling configuration
  pollingInterval: parseInt(process.env.BOTBIZ_POLLING_INTERVAL, 10) || 10000, // Default to 10 seconds
  
  // Logging options
  logging: {
    enabled: process.env.NODE_ENV !== 'production',
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
  }
}; 