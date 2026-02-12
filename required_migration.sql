-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add 'source' column to 'stock_units' table
ALTER TABLE stock_units 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Bawaria Motors';

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_stock_units_source ON stock_units(source);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
