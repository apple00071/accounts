require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const supabase = require('./config/supabase');
const webhookRoutes = require('./routes/webhook');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const whatsapp360DialogRoutes = require('./routes/whatsapp360dialog');
const whatsappTwilioRoutes = require('./routes/whatsappTwilio');
const whatsappMetaRoutes = require('./routes/whatsappMeta');
const whatsappBotbizRoutes = require('./routes/whatsappBotbiz');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/whatsapp/360dialog', whatsapp360DialogRoutes);
app.use('/api/whatsapp/twilio', whatsappTwilioRoutes);
app.use('/api/whatsapp/meta', whatsappMetaRoutes);
app.use('/api/whatsapp/botbiz', whatsappBotbizRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Accounting API',
    endpoints: {
      webhook: '/webhook',
      customers: '/api/customers',
      payments: '/api/payments'
    }
  });
});

module.exports = app; 