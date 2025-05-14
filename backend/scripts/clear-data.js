require('dotenv').config();
const supabase = require('../src/config/supabase');

async function clearAllData() {
  try {
    console.log('Deleting all payments...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (paymentsError) {
      throw paymentsError;
    }

    console.log('Deleting all customers...');
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (customersError) {
      throw customersError;
    }

    console.log('All data cleared successfully!');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

clearAllData(); 