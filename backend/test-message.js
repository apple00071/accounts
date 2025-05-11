/**
 * Simple test script for WhatsApp message processing
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');

// The message we want to test
const testMessage = "Kumar paid 2000";
const phoneNumber = process.env.BOTBIZ_PHONE_NUMBER || "919177197474";

// Simulate sending a message directly to the webhook
async function testWebhook() {
  console.log("\n=== Testing WhatsApp Message Processing ===");
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Message: "${testMessage}"`);
  
  try {
    // Send directly to internal webhook endpoint
    const response = await axios.post(
      `http://localhost:${process.env.PORT || 3000}/webhook`,
      {
        from: phoneNumber,
        text: testMessage
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("\n✅ Message processed successfully!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
    // The response should include parsed payment information
    if (response.data.messageToSend) {
      console.log("\nThe system responded with:");
      console.log(response.data.messageToSend);
    }
    
  } catch (error) {
    console.error("\n❌ Error testing webhook:");
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Error details:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testWebhook().then(() => {
  console.log("\nTest completed!");
}); 