/**
 * BotBiz API Configuration
 * 
 * This file contains the configuration for the BotBiz API integration,
 * including endpoints, authentication, and default settings.
 */

module.exports = {
  // Base API URL
  baseUrl: 'https://dash.botbiz.io/v1',
  
  // API Endpoints
  endpoints: {
    send: '/send',
    messages: '/messages'
  },
  
  // Default headers
  getHeaders: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }),
  
  // Webhook configuration
  webhook: {
    verifyToken: process.env.BOTBIZ_VERIFY_TOKEN || '8450385012773603920',
    path: '/webhook'
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
  
  // Logging options
  logging: {
    enabled: process.env.NODE_ENV !== 'production',
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
  }
}; 