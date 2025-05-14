-- Add business_id column to customers table if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Create index for business_id
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);

-- For now, we'll update all existing customers to belong to the first business in the system
UPDATE customers c
SET business_id = (
    SELECT id 
    FROM businesses 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE c.business_id IS NULL;

-- Make business_id NOT NULL after updating existing records
ALTER TABLE customers ALTER COLUMN business_id SET NOT NULL; 