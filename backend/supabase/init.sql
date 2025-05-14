-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED')),
    phone_number TEXT
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    access_code_id UUID REFERENCES access_codes(id),
    is_active BOOLEAN DEFAULT true,
    expects_access_code BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('INCOMING', 'OUTGOING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_phone ON chat_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_phone ON chat_messages(phone_number);

-- Create function to automatically expire access codes
CREATE OR REPLACE FUNCTION expire_access_codes() RETURNS trigger AS $$
BEGIN
    UPDATE access_codes
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically expire access codes
CREATE TRIGGER expire_access_codes_trigger
    AFTER INSERT OR UPDATE ON access_codes
    EXECUTE FUNCTION expire_access_codes(); 