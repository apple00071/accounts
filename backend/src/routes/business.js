const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { validateEmail, validatePhoneNumber } = require('../utils/validation');
const verifyToken = require('../middleware/auth');

// Register a new business
router.post('/register', async (req, res) => {
    try {
        const { name, ownerName, email, phoneNumber, password } = req.body;

        // Validate input
        if (!name || !ownerName || !email || !phoneNumber || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if email already exists
        const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', email)
            .single();

        if (existingBusiness) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new business
        const { data: newBusiness, error } = await supabase
            .from('businesses')
            .insert([
                {
                    name,
                    owner_name: ownerName,
                    email,
                    phone_number: phoneNumber,
                    password_hash: passwordHash
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Business registered successfully',
            business: {
                id: newBusiness.id,
                name: newBusiness.name,
                ownerName: newBusiness.owner_name,
                email: newBusiness.email,
                phoneNumber: newBusiness.phone_number
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register a new business with access code
router.post('/register-with-code', async (req, res) => {
    try {
        const { name, ownerName, email, phoneNumber, password, accessCode } = req.body;

        // Validate input
        if (!name || !ownerName || !email || !phoneNumber || !password || !accessCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if email already exists
        const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', email)
            .single();

        if (existingBusiness) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Validate access code
        const { data: codeData, error: codeError } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', accessCode)
            .eq('status', 'active')
            .single();

        if (codeError || !codeData) {
            return res.status(400).json({ error: 'Invalid or expired access code' });
        }

        if (new Date(codeData.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Access code has expired' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Start a transaction
        const { data: newBusiness, error: businessError } = await supabase
            .from('businesses')
            .insert([
                {
                    name,
                    owner_name: ownerName,
                    email,
                    phone_number: phoneNumber,
                    password_hash: passwordHash
                }
            ])
            .select()
            .single();

        if (businessError) throw businessError;

        // Update access code status
        const { error: updateError } = await supabase
            .from('access_codes')
            .update({
                status: 'used',
                used_at: new Date().toISOString(),
                used_by: newBusiness.id
            })
            .eq('id', codeData.id);

        if (updateError) throw updateError;

        res.status(201).json({
            message: 'Business registered successfully',
            business: {
                id: newBusiness.id,
                name: newBusiness.name,
                ownerName: newBusiness.owner_name,
                email: newBusiness.email,
                phoneNumber: newBusiness.phone_number
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login business
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get business by email
        const { data: business, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !business) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, business.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                businessId: business.id,
                email: business.email,
                phoneNumber: business.phone_number
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            business: {
                id: business.id,
                name: business.name,
                ownerName: business.owner_name,
                email: business.email,
                phoneNumber: business.phone_number
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected routes - require authentication
// Get business statistics
router.get('/stats/:businessId', verifyToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Get total customers
        const customersResult = await supabase
            .from('customers')
            .select('COUNT(*) as total')
            .eq('business_id', businessId);

        // Get active chats
        const activeChatsResult = await supabase
            .from('chat_sessions')
            .select('COUNT(*) as total')
            .eq('business_id', businessId)
            .eq('is_active', true);

        // Get total messages
        const messagesResult = await supabase
            .from('chat_messages')
            .select('COUNT(*) as total, COUNT(CASE WHEN message_type = \'INCOMING\' THEN 1 END) as incoming, COUNT(CASE WHEN message_type = \'OUTGOING\' THEN 1 END) as outgoing')
            .eq('session_id', supabase
                .from('chat_sessions')
                .select('id')
                .eq('business_id', businessId)
                .eq('is_active', true)
            );

        // Calculate response rate
        const responseRate = messagesResult.data[0].incoming > 0
            ? Math.round((messagesResult.data[0].outgoing / messagesResult.data[0].incoming) * 100)
            : 100;

        res.json({
            totalCustomers: parseInt(customersResult.data[0].total),
            activeChats: parseInt(activeChatsResult.data[0].total),
            totalMessages: parseInt(messagesResult.data[0].total),
            responseRate: responseRate
        });
    } catch (error) {
        console.error('Error fetching business stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get payment summary
router.get('/payments/summary', verifyToken, async (req, res) => {
    try {
        const businessId = req.query.businessId;

        if (!businessId) {
            return res.status(400).json({ error: 'Business ID is required' });
        }

        // Verify that the requesting user has access to this business
        if (req.user.businessId !== businessId) {
            return res.status(403).json({ error: 'Access denied. You can only access your own business data.' });
        }

        // Get total payments received (CREDIT)
        const { data: creditsData, error: creditsError } = await supabase
            .from('payments')
            .select('amount')
            .eq('business_id', businessId)
            .eq('direction', 'CREDIT');

        if (creditsError) throw creditsError;

        // Get total payments made (DEBIT)
        const { data: debitsData, error: debitsError } = await supabase
            .from('payments')
            .select('amount')
            .eq('business_id', businessId)
            .eq('direction', 'DEBIT');

        if (debitsError) throw debitsError;

        // Calculate totals
        const totalReceived = creditsData.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalPaid = debitsData.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = totalReceived - totalPaid;

        // Get recent transactions
        const { data: recentTransactions, error: recentError } = await supabase
            .from('payments')
            .select(`
                id,
                amount,
                direction,
                date,
                method,
                customer:customers(name)
            `)
            .eq('business_id', businessId)
            .order('date', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;

        res.json({
            summary: {
                totalReceived,
                totalPaid,
                balance,
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({ error: 'Failed to fetch payment summary' });
    }
});

// Get dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const businessId = req.user?.businessId;
        if (!businessId) {
            return res.status(400).json({ error: 'Business ID not found in token' });
        }
        console.log('Fetching dashboard data for business:', businessId);

        // Get all customers for this business with their payment summaries
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, name, is_active')
            .eq('business_id', businessId);

        if (customersError) {
            console.error('Error fetching customers:', customersError);
            return res.status(500).json({ error: 'Failed to fetch customers' });
        }

        if (!customers) {
            return res.json({
                summary: {
                    totalReceived: 0,
                    totalPaid: 0,
                    currentBalance: 0,
                    activeCustomers: 0
                },
                recentTransactions: []
            });
        }

        const customerIds = customers.filter(c => c.is_active).map(c => c.id);

        if (customerIds.length === 0) {
            // Return empty dashboard if no customers
            return res.json({
                summary: {
                    totalReceived: 0,
                    totalPaid: 0,
                    currentBalance: 0,
                    activeCustomers: 0
                },
                recentTransactions: []
            });
        }

        // Get total payments received (CREDIT)
        const { data: creditsData, error: creditsError } = await supabase
            .from('payments')
            .select('amount')
            .in('customer_id', customerIds)
            .eq('direction', 'CREDIT');

        if (creditsError) {
            console.error('Error fetching credits:', creditsError);
            return res.status(500).json({ error: 'Failed to fetch credit payments' });
        }

        // Get total payments made (DEBIT)
        const { data: debitsData, error: debitsError } = await supabase
            .from('payments')
            .select('amount')
            .in('customer_id', customerIds)
            .eq('direction', 'DEBIT');

        if (debitsError) {
            console.error('Error fetching debits:', debitsError);
            return res.status(500).json({ error: 'Failed to fetch debit payments' });
        }

        // Calculate totals
        const totalReceived = creditsData ? creditsData.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
        const totalPaid = debitsData ? debitsData.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
        const currentBalance = totalReceived - totalPaid;

        // Get recent transactions
        const { data: recentTransactions, error: recentError } = await supabase
            .from('payments')
            .select('id, amount, direction, date, method, customer_id')
            .in('customer_id', customerIds)
            .order('date', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('Error fetching recent transactions:', recentError);
            return res.status(500).json({ error: 'Failed to fetch recent transactions' });
        }

        // Create a map of customer names for easy lookup
        const customerMap = customers.reduce((acc, customer) => {
            acc[customer.id] = customer.name;
            return acc;
        }, {});

        // Format the response
        const dashboardData = {
            summary: {
                totalReceived,
                totalPaid,
                currentBalance,
                activeCustomers: customerIds.length
            },
            recentTransactions: recentTransactions ? recentTransactions.map(tx => ({
                id: tx.id,
                amount: Number(tx.amount || 0),
                type: tx.direction?.toLowerCase() || 'unknown',
                description: customerMap[tx.customer_id] || 'Unknown Customer',
                date: tx.date || new Date().toISOString()
            })) : []
        };

        console.log('Sending dashboard data:', dashboardData);
        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router; 