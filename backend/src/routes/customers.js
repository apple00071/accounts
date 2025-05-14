const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all customers with their balances
router.get('/', async (req, res) => {
  try {
    // Get all customers and their payments
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        payments (
          amount,
          direction
        )
      `);

    if (customerError) throw customerError;

    const customersWithBalance = customers.map(customer => {
      const balance = customer.payments.reduce((acc, payment) => {
        return payment.direction === 'CREDIT'
          ? acc + payment.amount
          : acc - payment.amount;
      }, 0);

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phone_number,
        balance,
        transactionCount: customer.payments.length
      };
    });

    res.json(customersWithBalance);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID with payment history
router.get('/:id', async (req, res) => {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        payments (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (customerError) throw customerError;

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const balance = customer.payments.reduce((acc, payment) => {
      return payment.direction === 'CREDIT'
        ? acc + payment.amount
        : acc - payment.amount;
    }, 0);

    res.json({
      ...customer,
      phoneNumber: customer.phone_number,
      balance
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Get customer payment history
router.get('/:id/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const start = (page - 1) * limit;

    // Get total count
    const { count: total } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('customer_id', req.params.id);

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
      .eq('customer_id', req.params.id)
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
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }

    // Create new customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([
        { name, phone_number: phoneNumber }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    // Update customer
    const { data: customer, error } = await supabase
      .from('customers')
      .update({ 
        name,
        phone_number: phoneNumber || '' // Use empty string instead of null
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router; 