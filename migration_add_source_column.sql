-- Add source column to differentiate between Bawaria Motors and BMW PL stock
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Bawaria Motors';

-- Index for performance filtering
CREATE INDEX IF NOT EXISTS idx_cars_source ON cars(source);

-- Update RLS if needed (generally not needed if policies are open or same for all sources)
