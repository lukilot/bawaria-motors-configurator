-- Add body_group column to stock_units table
ALTER TABLE stock_units ADD COLUMN IF NOT EXISTS body_group TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_body_group ON stock_units(body_group);
