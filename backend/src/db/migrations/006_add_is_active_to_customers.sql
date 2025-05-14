-- Add is_active column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Update existing customers to be active
UPDATE customers SET is_active = true WHERE is_active IS NULL; 