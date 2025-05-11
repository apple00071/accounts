const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhook');
const whatsapp360DialogRoutes = require('./routes/whatsapp360dialog');
const whatsappTwilioRoutes = require('./routes/whatsappTwilio');
const whatsappMetaRoutes = require('./routes/whatsappMeta');
const whatsappBotbizRoutes = require('./routes/whatsappBotbiz');
const settingsRoutes = require('./routes/settings');
const testRoutes = require('./routes/test');
const dashboardRoutes = require('./routes/dashboard');

// Import BotBiz poller if enabled
const { initBotbizPoller } = require('./services/botbizPoller');

// Create Express app
const app = express();

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Async error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/whatsapp/360dialog', whatsapp360DialogRoutes);
app.use('/api/whatsapp/twilio', whatsappTwilioRoutes);
app.use('/api/whatsapp/meta', whatsappMetaRoutes);
app.use('/api/whatsapp/botbiz', whatsappBotbizRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to WhatsApp Accounting API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start BotBiz polling if enabled
if (process.env.BOTBIZ_ENABLED === 'true' && process.env.BOTBIZ_API_KEY) {
  try {
    initBotbizPoller();
    console.log('BotBiz polling service initialized');
  } catch (error) {
    console.error('Failed to initialize BotBiz polling service:', error.message);
  }
}

module.exports = app; 