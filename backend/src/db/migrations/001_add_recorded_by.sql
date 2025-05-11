-- Add recorded_by column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS recorded_by TEXT NOT NULL DEFAULT '919177197474';

-- Remove the default after adding the column
ALTER TABLE payments 
ALTER COLUMN recorded_by DROP DEFAULT;

-- Add index for recorded_by column
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON payments(recorded_by); 