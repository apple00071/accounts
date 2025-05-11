# WhatsApp Integration Troubleshooting Guide

This guide will help you troubleshoot issues with your WhatsApp integration, particularly focusing on BotBiz as the provider.

## Testing Your BotBiz Integration

If your WhatsApp chatbot isn't responding to messages, follow these steps to diagnose and fix the problem:

### Determine Your Integration Approach

The WhatsApp Accounting application supports two integration approaches with BotBiz:

1. **Webhook Approach**: BotBiz sends real-time webhook notifications to your application
2. **Polling Approach**: Your application periodically polls the BotBiz API for new messages

The troubleshooting steps will depend on which approach you're using.

### A. Testing the Webhook Approach

If you're using webhooks, follow these steps:

### 1. Test Your BotBiz Webhook Directly

The most direct way to test if your webhook is working is to use the test script:

```bash
cd backend
npm run test:botbiz
```

This will prompt you to enter a phone number and a test message. The script will then simulate a webhook call from BotBiz to your local server, which is helpful to verify that:

- Your server is running and accepting webhook calls
- Your webhook verification is working
- Your message processing logic is functioning correctly

### 2. Check Your Server Is Running

Make sure your server is running in development mode:

```bash
cd backend
npm run dev
```

The console should show your server starting up without errors.

### 3. Set Up Tunneling for Local Development

For BotBiz to reach your local webhook during development, you need to expose your local server to the internet:

1. Install [ngrok](https://ngrok.com/download) if you haven't already
2. Start ngrok with: `ngrok http 3000` (assuming your server runs on port 3000)
3. Copy the HTTPS URL provided by ngrok (e.g., https://abc123.ngrok.io)
4. Update your BotBiz webhook URL in the BotBiz dashboard to use this ngrok URL
5. The full webhook URL should be: `https://your-ngrok-url/api/whatsapp/botbiz`

### 4. Check BotBiz Webhook Configuration

Verify that your webhook is correctly configured in the BotBiz dashboard:

1. Log in to your BotBiz dashboard at [dash.botbiz.io](https://dash.botbiz.io)
2. Navigate to the Webhook settings
3. Check that your webhook URL is correct and points to `/api/whatsapp/botbiz`
4. Ensure you're using the correct verify token: `8450385012773603920`

### 5. Verify Environment Variables

Check that your `.env` file has the correct BotBiz configuration:

```
BOTBIZ_API_KEY=your_botbiz_api_key
BOTBIZ_VERIFY_TOKEN=8450385012773603920
BOTBIZ_PHONE_NUMBER=your_whatsapp_number
BOTBIZ_ENABLED=true
```

### 6. Check Logs for Errors

When receiving a message, multiple log entries should appear in your server console:

1. "Received BotBiz webhook payload"
2. "BotBiz webhook data: {...}"
3. "Processing message from [number]: [text]"
4. "Successfully processed message from [number]"

If any of these are missing or you see error messages, investigate those specific issues.

### 7. Test With Simple Messages

Try sending these simple test messages to your WhatsApp business number:

- "Hello"
- "Help"
- "Received 500 from John"
- "What's my balance?"

### B. Testing the Polling Approach

If you're using the polling approach, follow these steps:

### 1. Test Your BotBiz API Polling

Use the test script with the polling option:

```bash
cd backend
node test-botbiz.js
```

This will simulate sending messages via the BotBiz API and verify that your polling service can:
- Connect to the BotBiz API
- Process messages correctly
- Send appropriate responses

### 2. Check Your Server Is Running

Make sure your server is running in development mode:

```bash
cd backend
npm run dev
```

The console should show:
- Your server starting up without errors
- The "BotBiz polling service initialized" message
- Regular polling logs ("Polling BotBiz API for new messages...")

### 3. Verify Environment Variables

Check that your `.env` file has the correct BotBiz configuration for polling:

```
BOTBIZ_API_KEY=your_botbiz_api_key
BOTBIZ_PHONE_NUMBER=your_whatsapp_number
BOTBIZ_ENABLED=true
BOTBIZ_POLLING_INTERVAL=10000
```

### 4. Check Logs for Polling Activity

When the polling service is running, you should see:
1. "Starting BotBiz polling service..." at server startup
2. "Polling BotBiz API for new messages..." at regular intervals
3. "Received [N] new messages from BotBiz API" when messages are received

If these logs are missing or you see error messages, investigate those specific issues.

## Common Issues and Solutions

### No Response from Chatbot

**For Webhook Approach:**
- BotBiz webhook is not configured correctly
- Your server is not accessible from the internet
- The webhook verification token is incorrect
- Your server is crashing when processing messages

**Solutions:**
1. Verify your webhook URL in the BotBiz dashboard
2. Check that ngrok is running if testing locally
3. Ensure the verify token in your .env matches the one in BotBiz
4. Check your server logs for errors

**For Polling Approach:**
- BotBiz API key is incorrect
- Polling service is not running
- Polling interval is too long
- API rate limits are being hit
- Message processing has errors

**Solutions:**
1. Verify your API key is correct in the .env file
2. Check server logs to confirm the polling service is running
3. Decrease the polling interval (e.g., to 5000ms) for more frequent checks
4. Ensure your API credentials have sufficient permissions

### Webhook Verification Failures

**Possible causes:**
- Incorrect verify token
- Incorrectly formatted webhook URL

**Solutions:**
1. Double-check the BOTBIZ_VERIFY_TOKEN in your .env file
2. Make sure your webhook URL ends with `/api/whatsapp/botbiz`

### Messages Not Being Processed

**Possible causes:**
- Incorrect message format parsing
- Error in your business logic
- Issues with forwarding to the internal webhook

**Solutions:**
1. Check if the BotBiz webhook is receiving messages (logs should show this)
2. Verify that the internal webhook forwarding is working
3. Test with a simple message to see if basic functionality works

## Getting Additional Help

If you're still experiencing issues after trying these troubleshooting steps, consult the BotBiz documentation or contact BotBiz support with the following information:

1. Your webhook URL configuration
2. Server logs showing the issue
3. Steps you've already taken to troubleshoot
4. Specific error messages you're seeing 