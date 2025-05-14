require('dotenv').config();
const supabase = require('../src/config/supabase');

async function fixCustomerPhoneNumbers() {
  try {
    // Get all customers with BotBiz number
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', process.env.BOTBIZ_PHONE_NUMBER);

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    console.log(`Found ${customers.length} customers with BotBiz phone number`);

    // Update each customer to set phone_number to empty string instead of null
    for (const customer of customers) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ phone_number: '' })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`Error updating customer ${customer.name}:`, updateError);
      } else {
        console.log(`Updated customer: ${customer.name}`);
      }
    }

    console.log('Finished updating customers');
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the fix
fixCustomerPhoneNumbers(); 