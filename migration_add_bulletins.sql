-- Create bulletins table for sales conditions (rabaty / biuletyny)
CREATE TABLE bulletins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,                          -- e.g. "Biuletyn Zimowy 2026 - X6"
  description TEXT,                            -- Admin notes
  
  -- Targeting criteria (nullable = wildcard / "all")
  model_codes TEXT[],                          -- e.g. ['41EX', '31EY'] or NULL/empty for "any"
  body_groups TEXT[],                          -- e.g. ['G06'] or NULL/empty for "any"
  production_year_min INT,                     -- e.g. 2025 or NULL for "any"
  production_year_max INT,                     -- e.g. 2025 or NULL for "any"

  -- Discount values (at least one should be > 0)
  discount_amount NUMERIC DEFAULT 0,           -- Flat PLN discount (e.g. 15000)
  discount_percent NUMERIC DEFAULT 0,          -- Percentage discount (e.g. 5.0 means 5%)

  -- Validity
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,                             -- Optional start date
  valid_until DATE,                            -- Optional end date
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;

-- Public can read active bulletins (needed for SRP/VDP price computation)
CREATE POLICY "Public can read active bulletins"
  ON bulletins FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins have full access to bulletins"
  ON bulletins FOR ALL
  USING (true);

-- Index for efficient lookups
CREATE INDEX idx_bulletins_active ON bulletins(is_active);
CREATE INDEX idx_bulletins_body_groups ON bulletins USING GIN(body_groups);
CREATE INDEX idx_bulletins_model_codes ON bulletins USING GIN(model_codes);
