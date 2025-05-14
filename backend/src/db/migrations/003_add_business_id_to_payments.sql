-- Add business_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Update existing payments with business_id from their customers
UPDATE payments 
SET business_id = customers.business_id 
FROM customers 
WHERE payments.customer_id = customers.id;

-- Make business_id NOT NULL after populating data
ALTER TABLE payments 
ALTER COLUMN business_id SET NOT NULL;

-- Create index on business_id
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id); 