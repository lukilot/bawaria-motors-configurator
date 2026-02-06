-- 1. Create table for Service Packages (Metadata)
CREATE TABLE IF NOT EXISTS service_packages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BRI', 'BSI', 'BSI_PLUS')),
  duration_months INTEGER,
  mileage_limit INTEGER,
  description TEXT,
  plus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create table for Pricing Matrix (Price per Series)
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_code TEXT REFERENCES service_packages(code) ON DELETE CASCADE,
  series_code TEXT NOT NULL, -- e.g. 'G60', 'G45'
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_code, series_code)
);

-- 3. Enable RLS (Safe to run multiple times)
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for packages" ON service_packages;
CREATE POLICY "Public read access for packages" ON service_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for prices" ON service_prices;
CREATE POLICY "Public read access for prices" ON service_prices FOR SELECT USING (true);

-- 5. Insert Seed Data (BRI)
INSERT INTO service_packages (code, name, type, duration_months, mileage_limit) VALUES
('7CG', 'Repair Inclusive - 3 lata / 200.000 km', 'BRI', 36, 200000),
('7CH', 'Repair Inclusive - 4 lata / 200.000 km', 'BRI', 48, 200000),
('7CK', 'Repair Inclusive - 5 lat / 200.000 km', 'BRI', 60, 200000)
ON CONFLICT (code) DO NOTHING;

-- 6. Insert Seed Data (BSI)
INSERT INTO service_packages (code, name, type, duration_months, mileage_limit) VALUES
('7US', 'Service Inclusive - 3 lata / 40.000 km', 'BSI', 36, 40000),
('7NG', 'Service Inclusive - 3 lata / 60.000 km', 'BSI', 36, 60000),
('7DD', 'Service Inclusive - 4 lata / 60.000 km', 'BSI', 48, 60000),
('7NX', 'Service Inclusive - 4 lata / 80.000 km', 'BSI', 48, 80000),
('7NW', 'Service Inclusive - 5 lat / 60.000 km', 'BSI', 60, 60000),
('7N7', 'Service Inclusive - 5 lat / 80.000 km', 'BSI', 60, 80000),
('7NH', 'Service Inclusive - 5 lat / 100.000 km', 'BSI', 60, 100000),
('7UA', 'Service Inclusive - 6 lat / 120.000 km', 'BSI', 72, 120000)
ON CONFLICT (code) DO NOTHING;

-- 7. Insert Seed Data (BSI Plus)
INSERT INTO service_packages (code, name, type, duration_months, mileage_limit, plus) VALUES
('7NK', 'Service Inclusive Plus - 5 lat / 60.000 km', 'BSI_PLUS', 60, 60000, true),
('7N8', 'Service Inclusive Plus - 5 lat / 80.000 km', 'BSI_PLUS', 60, 80000, true),
('7NA', 'Service Inclusive Plus - 5 lat / 100.000 km', 'BSI_PLUS', 60, 100000, true),
('7UB', 'Service Inclusive Plus - 6 lat / 120.000 km', 'BSI_PLUS', 72, 120000, true)
ON CONFLICT (code) DO NOTHING;

-- 8. Insert Prices from Price List (G60 and G61)
INSERT INTO service_prices (package_code, series_code, price) VALUES
-- BSI (G60)
('7US', 'G60', 2480),
('7NG', 'G60', 4210),
('7DD', 'G60', 5810),
('7NX', 'G60', 6360),
('7NW', 'G60', 6780),
('7N7', 'G60', 6930),
('7NH', 'G60', 8560),
('7UA', 'G60', 11300),
-- BSI Plus (G60)
('7NK', 'G60', 10590),
('7N8', 'G60', 11250),
('7NA', 'G60', 17960),
('7UB', 'G60', 22600),
-- BRI (G60)
('7CG', 'G60', 2540),
('7CH', 'G60', 7960),
('7CK', 'G60', 15200),

-- BSI (G61) - Duplicate of G60
('7US', 'G61', 2480),
('7NG', 'G61', 4210),
('7DD', 'G61', 5810),
('7NX', 'G61', 6360),
('7NW', 'G61', 6780),
('7N7', 'G61', 6930),
('7NH', 'G61', 8560),
('7UA', 'G61', 11300),
-- BSI Plus (G61)
('7NK', 'G61', 10590),
('7N8', 'G61', 11250),
('7NA', 'G61', 17960),
('7UB', 'G61', 22600),
-- BRI (G61)
('7CG', 'G61', 2540),
('7CH', 'G61', 7960),
('7CK', 'G61', 15200)

ON CONFLICT (package_code, series_code) 
DO UPDATE SET price = EXCLUDED.price;
