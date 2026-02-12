-- Add source column to stock_units table (where sync logic actually points)
ALTER TABLE stock_units 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Bawaria Motors';

-- Index for performance filtering
CREATE INDEX IF NOT EXISTS idx_stock_units_source ON stock_units(source);
