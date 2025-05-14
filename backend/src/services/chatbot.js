const { verifyAccessCode } = require('../models/accessCode');
const supabase = require('../config/supabase');

const REGISTRATION_LINK = process.env.REGISTRATION_LINK || 'https://your-registration-page.com';

const handleInitialGreeting = () => {
    return {
        message: `👋 Welcome to WhatsApp Accounting Bot!\n\nPlease choose an option:\n1. Register\n2. Login with Access Code\n\nReply with the number of your choice.`,
        expects: ['1', '2']
    };
};

const handleRegistration = () => {
    return {
        message: `To register for WhatsApp Accounting, please visit:\n${REGISTRATION_LINK}\n\nAfter registration, an admin will review your application and provide you with an access code.`,
        expects: []
    };
};

const handleLoginPrompt = () => {
    return {
        message: `Please enter your access code to login:`,
        expects: ['ACCESS_CODE']
    };
};

const handleAccessCodeVerification = async (code) => {
    const result = await verifyAccessCode(code);
    
    if (!result.valid) {
        return {
            message: `❌ ${result.message}. Please contact support if you need assistance.`,
            expects: []
        };
    }

    // Create or update business session
    const { data: session, error } = await supabase
        .from('business_sessions')
        .upsert({
            business_id: result.data.business_id,
            phone_number: result.data.phone_number,
            last_active: new Date(),
            is_active: true
        })
        .select()
        .single();

    if (error) {
        return {
            message: '❌ Error creating session. Please try again or contact support.',
            expects: []
        };
    }

    return {
        message: `✅ Access code verified! Welcome to WhatsApp Accounting.\n\nAvailable commands:\n- Balance\n- Add Payment\n- View History\n- Help`,
        expects: ['COMMAND']
    };
};

const handleMessage = async (phoneNumber, message) => {
    // Get current session state
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_active', true)
        .single();

    const text = message.toLowerCase().trim();

    // Initial greeting or no active session
    if (!session || text === 'hi' || text === 'hello') {
        return handleInitialGreeting();
    }

    // Handle registration choice
    if (text === '1') {
        return handleRegistration();
    }

    // Handle login choice
    if (text === '2') {
        return handleLoginPrompt();
    }

    // Handle access code verification
    if (session.expects_access_code) {
        return handleAccessCodeVerification(text);
    }

    // If no valid command matches
    return {
        message: "I don't understand that command. Please try again or type 'help' for assistance.",
        expects: []
    };
};

module.exports = {
    handleMessage
}; 