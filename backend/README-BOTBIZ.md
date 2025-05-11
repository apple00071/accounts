# BotBiz WhatsApp Integration Guide

This guide provides a comprehensive overview of how to set up and use the BotBiz WhatsApp integration with your WhatsApp Accounting application.

## Overview

[BotBiz](https://dash.botbiz.io/) serves as a Business Solution Provider (BSP) for WhatsApp Business API, providing an easier way to integrate WhatsApp messaging capabilities into your application without going through the more complex process of direct Meta API integration.

This integration enables your WhatsApp Accounting application to:
- Receive messages from users via WhatsApp
- Send automated responses back to users
- Process accounting commands and queries through natural language
- Send notifications and updates to users

## Setup Instructions

### 1. Create a BotBiz Account

1. Go to [dash.botbiz.io](https://dash.botbiz.io/) and sign up for an account
2. Complete the verification process
3. Get approved for the WhatsApp Business API

### 2. Configure Your BotBiz Dashboard

1. Create a new WhatsApp number or connect your existing WhatsApp Business number
2. Make note of your WhatsApp number and API key from the BotBiz dashboard

### 3. Configure Your Application

1. Add your BotBiz credentials to the `.env` file:
   ```
   BOTBIZ_API_KEY=your_botbiz_api_key
   BOTBIZ_VERIFY_TOKEN=8450385012773603920
   BOTBIZ_PHONE_NUMBER=your_whatsapp_number
   BOTBIZ_ENABLED=true
   BOTBIZ_POLLING_INTERVAL=10000 # Poll every 10 seconds
   ```

2. Disable other WhatsApp providers by setting their `ENABLED` variables to `false`:
   ```
   META_ENABLED=false
   TWILIO_ENABLED=false
   DIALOG360_ENABLED=false
   ```

3. Start your server to apply the changes:
   ```bash
   npm run dev
   ```

### 4. Testing the Integration

Use the built-in testing tool to verify your BotBiz integration:

```bash
npm run test:botbiz
```

This will allow you to simulate incoming messages from BotBiz and verify that your application is correctly processing them.

## How It Works

BotBiz integration supports two different approaches to connect with WhatsApp:

### Option 1: Webhook Approach

In this approach, your application receives real-time updates via webhooks:

1. A user sends a message to your WhatsApp Business number
2. BotBiz receives the message and forwards it to your webhook URL
3. Your application verifies the webhook request using the verify token
4. Your webhook extracts the sender's phone number and message text
5. The message is forwarded to your internal webhook handler for processing
6. Your business logic generates a response
7. The response is sent back to the user via the BotBiz API

### Option 2: Polling Approach

If webhooks don't work in your environment, you can use the polling approach:

1. The application periodically polls the BotBiz API for new messages
2. When new messages are found, they are processed by your business logic
3. Responses are sent back to users via the BotBiz send API
4. This approach works without requiring a public webhook URL

To enable polling:
- Ensure `BOTBIZ_POLLING_INTERVAL` is set in your `.env` file (default is 10000ms)
- No webhook configuration is needed on the BotBiz dashboard

### Key Files

- `backend/src/routes/whatsappBotbiz.js`: Handles incoming webhook requests from BotBiz (Option 1)
- `backend/src/services/botbizPoller.js`: Periodically polls for new messages (Option 2)
- `backend/src/utils/whatsappProvider.js`: Contains the `sendViaBotbiz` function to send messages
- `backend/src/config/botbiz.js`: Configuration settings for BotBiz API integration
- `backend/test-botbiz.js`: Testing tool for simulating BotBiz interactions
- `frontend/src/pages/WhatsAppSettings.jsx`: UI for configuring BotBiz settings

## Customizing the Integration

### Modifying the Message Format

BotBiz supports various message types beyond text, including:
- Media messages (images, documents, audio)
- Template messages
- Interactive messages with buttons

To implement these, you'll need to modify the `sendViaBotbiz` function in `backend/src/utils/whatsappProvider.js` to support additional message types.

### Handling Different BotBiz Webhook Formats

If BotBiz updates their webhook payload format, you may need to update the processing logic in `backend/src/routes/whatsappBotbiz.js` to correctly extract information from the new format.

## Troubleshooting

See the `TROUBLESHOOTING.md` file for common issues and solutions related to the BotBiz integration.

## Security Considerations

- Keep your API key secure and never commit it to version control
- Use HTTPS for your webhook URL in production
- Validate all incoming webhook requests using the verify token
- Consider implementing rate limiting to prevent abuse

## Implementation Summary

### Option 1: Webhook-Based Implementation

The webhook approach uses the following components:
- `backend/src/routes/whatsappBotbiz.js`: Handles incoming webhooks from BotBiz
- Server endpoint at `/api/whatsapp/botbiz` to receive webhook calls
- Verification token (`BOTBIZ_VERIFY_TOKEN`) to validate webhook requests
- Response handling via the WhatsApp provider utility

### Option 2: Polling-Based Implementation

The polling approach uses the following components:
- `backend/src/services/botbizPoller.js`: Polls the BotBiz API for new messages
- Configurable polling interval via `BOTBIZ_POLLING_INTERVAL` (default: 10 seconds)
- Message processing using the same business logic as the webhook approach
- Response sending via the BotBiz API send endpoint

Both approaches use the common components:
- `backend/src/utils/whatsappProvider.js`: For sending messages back to WhatsApp
- `backend/src/utils/messageParser.js`: For parsing incoming messages
- `backend/src/utils/responseGenerator.js`: For generating appropriate responses
- `backend/src/config/botbiz.js`: For managing BotBiz API configuration

## Additional Resources

- [BotBiz Documentation](https://docs.botbiz.io/)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/api/webhooks)
- [ngrok Documentation](https://ngrok.com/docs) for local development testing 