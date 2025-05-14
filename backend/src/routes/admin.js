const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Not authorized as admin' });
        }
        req.adminId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all businesses with their status and last active time
router.get('/businesses', verifyAdminToken, async (req, res) => {
    try {
        const { data: businesses, error } = await supabase
            .from('businesses')
            .select(`
                id,
                name,
                email,
                phone_number,
                is_active,
                created_at,
                last_active
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Format the businesses data
        const formattedBusinesses = businesses.map(business => ({
            id: business.id,
            name: business.name,
            email: business.email,
            phoneNumber: business.phone_number,
            isActive: business.is_active,
            createdAt: business.created_at,
            lastActive: business.last_active
        }));

        res.json({ businesses: formattedBusinesses });
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// Toggle business status (active/blocked)
router.patch('/businesses/:id/status', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const { data, error } = await supabase
            .from('businesses')
            .update({ 
                is_active: isActive,
                last_active: isActive ? new Date().toISOString() : null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: `Business ${isActive ? 'activated' : 'blocked'} successfully`,
            business: data
        });
    } catch (error) {
        console.error('Error updating business status:', error);
        res.status(500).json({ error: 'Failed to update business status' });
    }
});

// Get business details including usage statistics
router.get('/businesses/:id', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get business details
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', id)
            .single();

        if (businessError) throw businessError;

        // Get chat sessions statistics
        const { data: sessions, error: sessionsError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('business_id', id);

        if (sessionsError) throw sessionsError;

        // Get active sessions count
        const activeSessions = sessions.filter(session => session.is_active).length;

        // Get messages statistics
        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .in('session_id', sessions.map(s => s.id));

        if (messagesError) throw messagesError;

        // Calculate message statistics
        const incomingMessages = messages.filter(m => m.message_type === 'INCOMING').length;
        const outgoingMessages = messages.filter(m => m.message_type === 'OUTGOING').length;
        
        // Calculate response rate
        const responseRate = incomingMessages > 0 
            ? Math.round((outgoingMessages / incomingMessages) * 100) 
            : 0;

        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;

        // Sort messages by timestamp for each session
        const sessionMessages = messages.reduce((acc, msg) => {
            if (!acc[msg.session_id]) acc[msg.session_id] = [];
            acc[msg.session_id].push(msg);
            return acc;
        }, {});

        // Calculate response times
        Object.values(sessionMessages).forEach(sessionMsgs => {
            const sortedMsgs = sessionMsgs.sort((a, b) => 
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );

            for (let i = 1; i < sortedMsgs.length; i++) {
                const currentMsg = sortedMsgs[i];
                const prevMsg = sortedMsgs[i - 1];

                if (currentMsg.message_type === 'OUTGOING' && prevMsg.message_type === 'INCOMING') {
                    const responseTime = (new Date(currentMsg.sent_at).getTime() - new Date(prevMsg.sent_at).getTime()) / 1000; // Convert to seconds
                    totalResponseTime += responseTime;
                    responseCount++;
                }
            }
        });

        const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Format the response
        const businessData = {
            id: business.id,
            name: business.name,
            email: business.email,
            phoneNumber: business.phone_number,
            isActive: business.is_active,
            createdAt: business.created_at,
            lastActive: business.last_active,
            stats: {
                totalSessions: sessions.length,
                activeSessions,
                totalMessages: messages.length,
                incomingMessages,
                outgoingMessages,
                responseRate,
                averageResponseTime
            }
        };

        res.json({ business: businessData });
    } catch (error) {
        console.error('Error fetching business details:', error);
        res.status(500).json({ error: 'Failed to fetch business details' });
    }
});

// Get all access codes with additional details
router.get('/access-codes', verifyAdminToken, async (req, res) => {
    try {
        // First check if the table exists
        const { error: tableError } = await supabase
            .from('access_codes')
            .select('id')
            .limit(1);

        if (tableError && tableError.code === '42P01') {
            return res.json({ accessCodes: [] }); // Table doesn't exist yet
        }

        const { data: accessCodes, error } = await supabase
            .from('access_codes')
            .select(`
                id,
                code,
                business_name,
                created_at,
                expires_at,
                status,
                used_at,
                used_by
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get business details for used codes
        const businessIds = accessCodes
            .filter(code => code.used_by)
            .map(code => code.used_by);

        let businessMap = {};
        if (businessIds.length > 0) {
            const { data: businesses, error: businessError } = await supabase
                .from('businesses')
                .select('id, name, email')
                .in('id', businessIds);

            if (!businessError && businesses) {
                businessMap = businesses.reduce((acc, business) => {
                    acc[business.id] = business;
                    return acc;
                }, {});
            }
        }

        const formattedAccessCodes = accessCodes.map(code => ({
            id: code.id,
            code: code.code,
            businessName: code.business_name,
            isUsed: code.status === 'used',
            usedBy: code.used_by ? businessMap[code.used_by] : null,
            createdAt: code.created_at,
            expiresAt: code.expires_at,
            usedAt: code.used_at
        }));

        res.json({ accessCodes: formattedAccessCodes });
    } catch (error) {
        console.error('Error fetching access codes:', error);
        res.status(500).json({ error: 'Failed to fetch access codes' });
    }
});

// Generate new access code with business name and expiry
router.post('/access-codes', verifyAdminToken, async (req, res) => {
    try {
        const { businessName, expiryDays = 7 } = req.body;

        if (!businessName) {
            return res.status(400).json({ error: 'Business name is required' });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        const { data: accessCode, error } = await supabase
            .from('access_codes')
            .insert([{
                code: require('../utils/codeGenerator').generateRandomCode(),
                business_name: businessName,
                created_by: req.adminId,
                expires_at: expiresAt.toISOString(),
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Access code generated successfully',
            accessCode: {
                id: accessCode.id,
                code: accessCode.code,
                businessName: accessCode.business_name,
                isUsed: false,
                createdAt: accessCode.created_at,
                expiresAt: accessCode.expires_at
            }
        });
    } catch (error) {
        console.error('Error generating access code:', error);
        res.status(500).json({ error: 'Failed to generate access code' });
    }
});

// Extend access code expiry
router.patch('/access-codes/:id/extend', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalDays } = req.body;

        if (!additionalDays || additionalDays <= 0) {
            return res.status(400).json({ error: 'Valid number of additional days is required' });
        }

        // Get current access code
        const { data: currentCode, error: fetchError } = await supabase
            .from('access_codes')
            .select('expires_at, status')
            .eq('id', id)
            .single();

        if (fetchError || !currentCode) {
            return res.status(404).json({ error: 'Access code not found' });
        }

        if (currentCode.status !== 'active') {
            return res.status(400).json({ error: 'Can only extend active access codes' });
        }

        // Calculate new expiry date
        const currentExpiry = new Date(currentCode.expires_at);
        const newExpiry = new Date(currentExpiry.setDate(currentExpiry.getDate() + additionalDays));

        // Update access code
        const { data: updatedCode, error: updateError } = await supabase
            .from('access_codes')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            message: 'Access code expiry extended successfully',
            accessCode: {
                id: updatedCode.id,
                code: updatedCode.code,
                businessName: updatedCode.business_name,
                expiresAt: updatedCode.expires_at,
                status: updatedCode.status
            }
        });
    } catch (error) {
        console.error('Error extending access code:', error);
        res.status(500).json({ error: 'Failed to extend access code' });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get admin by email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                isAdmin: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 