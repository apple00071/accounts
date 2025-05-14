-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing objects to ensure clean creation
DO $$ 
BEGIN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
    DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
    DROP TRIGGER IF EXISTS update_access_codes_updated_at ON access_codes;
    DROP TRIGGER IF EXISTS expire_access_codes_trigger ON access_codes;
    
    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    DROP FUNCTION IF EXISTS expire_access_codes() CASCADE;
    
    -- Drop tables if they exist
    DROP TABLE IF EXISTS access_codes CASCADE;
    DROP TABLE IF EXISTS businesses CASCADE;
    DROP TABLE IF EXISTS admins CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors during drop
        NULL;
END $$;

-- Create businesses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'businesses'
    ) THEN
        CREATE TABLE businesses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone_number TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            last_active TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create trigger for businesses updated_at
        CREATE TRIGGER update_businesses_updated_at
            BEFORE UPDATE ON businesses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create access_codes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_codes'
    ) THEN
        CREATE TABLE access_codes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            code TEXT NOT NULL,
            business_name TEXT NOT NULL,
            created_by UUID REFERENCES admins(id),
            status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'used')),
            used_by UUID REFERENCES businesses(id) ON DELETE SET NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create trigger for access_codes updated_at
        CREATE TRIGGER update_access_codes_updated_at
            BEFORE UPDATE ON access_codes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'businesses'
        AND indexname = 'idx_businesses_email'
    ) THEN
        CREATE INDEX idx_businesses_email ON businesses(email);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'businesses'
        AND indexname = 'idx_businesses_phone_number'
    ) THEN
        CREATE INDEX idx_businesses_phone_number ON businesses(phone_number);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'access_codes'
        AND indexname = 'idx_access_codes_code'
    ) THEN
        CREATE INDEX idx_access_codes_code ON access_codes(code);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'access_codes'
        AND indexname = 'idx_access_codes_status'
    ) THEN
        CREATE INDEX idx_access_codes_status ON access_codes(status);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'access_codes'
        AND indexname = 'idx_access_codes_created_by'
    ) THEN
        CREATE INDEX idx_access_codes_created_by ON access_codes(created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'access_codes'
        AND indexname = 'idx_access_codes_used_by'
    ) THEN
        CREATE INDEX idx_access_codes_used_by ON access_codes(used_by);
    END IF;
END $$;

-- Create updated_at trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to automatically expire access codes
CREATE OR REPLACE FUNCTION expire_access_codes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.expires_at <= CURRENT_TIMESTAMP THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create expire_access_codes trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'expire_access_codes_trigger'
        AND tgrelid = 'access_codes'::regclass
    ) THEN
        CREATE TRIGGER expire_access_codes_trigger
            BEFORE INSERT OR UPDATE ON access_codes
            FOR EACH ROW
            EXECUTE FUNCTION expire_access_codes();
    END IF;
END $$; 