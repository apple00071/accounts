const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Create new payment
router.post('/', async (req, res) => {
  try {
    const { customerId, amount, direction, method, date, note } = req.body;

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Create payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        amount: Number(amount),
        direction,
        method,
        date: new Date(date).toISOString(),
        note,
        customer_id: customerId
      }])
      .select(`
        *,
        customer:customers (*)
      `)
      .single();

    if (error) throw error;

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payment summary
router.get('/summary', async (req, res) => {
  try {
    console.log('Fetching payment summary...');
    
    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'ETag': Date.now().toString() // Force client to revalidate
    });

    // Get all payments with fresh data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, direction')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }
    
    console.log(`Found ${payments.length} payments`);
    
    const summary = payments.reduce((acc, payment) => {
      if (payment.direction === 'CREDIT') {
        acc.totalReceived += Number(payment.amount);
      } else {
        acc.totalPaid += Number(payment.amount);
      }
      return acc;
    }, { totalPaid: 0, totalReceived: 0 });

    const outstandingBalance = summary.totalReceived - summary.totalPaid;

    console.log('Calculated summary:', summary);

    // Get recent transactions with fresh data
    const { data: recentTransactions, error: recentError } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers (
          name,
          phone_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error fetching recent transactions:', recentError);
      throw recentError;
    }

    console.log(`Found ${recentTransactions.length} recent transactions`);

    const response = {
      summary: {
        ...summary,
        outstandingBalance
      },
      recentTransactions
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get all payments with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const start = (page - 1) * limit;

    // Get total count
    const { count: total } = await supabase
      .from('payments')
      .select('*', { count: 'exact' });

    // Get paginated payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers (
          name,
          phone_number
        )
      `)
      .order('date', { ascending: false })
      .range(start, start + limit - 1);

    if (error) throw error;

    res.json({
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(payment);
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router; 