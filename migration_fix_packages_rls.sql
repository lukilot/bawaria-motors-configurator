-- FIX: Grant permissions to service_packages and service_prices for Anon/Public
-- Required because Admin Panel uses client-side requests without Supabase Auth (Password only)

-- 1. Enable RLS (if not already)
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (cleanup)
DROP POLICY IF EXISTS "Public Access Packages" ON service_packages;
DROP POLICY IF EXISTS "Public Access Prices" ON service_prices;
DROP POLICY IF EXISTS "Anon Insert Packages" ON service_packages;
DROP POLICY IF EXISTS "Anon Update Packages" ON service_packages;
DROP POLICY IF EXISTS "Anon Delete Packages" ON service_packages;
DROP POLICY IF EXISTS "Anon Insert Prices" ON service_prices;
DROP POLICY IF EXISTS "Anon Update Prices" ON service_prices;
DROP POLICY IF EXISTS "Anon Delete Prices" ON service_prices;

-- 3. Create Permissive Policies for 'service_packages'
-- Allow READ
CREATE POLICY "Public Read Packages"
ON service_packages FOR SELECT
USING (true);

-- Allow WRITE (Insert, Update, Delete) for Anon
-- Security Note: This relies on the Application Level Authentication (Admin Password)
CREATE POLICY "Anon Write Packages"
ON service_packages FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Create Permissive Policies for 'service_prices'
-- Allow READ
CREATE POLICY "Public Read Prices"
ON service_prices FOR SELECT
USING (true);

-- Allow WRITE
CREATE POLICY "Anon Write Prices"
ON service_prices FOR ALL
USING (true)
WITH CHECK (true);
