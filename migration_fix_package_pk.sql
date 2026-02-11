-- 1. Add ID to service_packages
ALTER TABLE service_packages DROP CONSTRAINT service_packages_pkey CASCADE;
ALTER TABLE service_packages ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- 2. Add Unique Constraint on (code, vehicle_type)
ALTER TABLE service_packages ADD CONSTRAINT service_packages_code_type_key UNIQUE (code, vehicle_type);

-- 3. Update service_prices to reference package_id
ALTER TABLE service_prices ADD COLUMN package_id uuid REFERENCES service_packages(id) ON DELETE CASCADE;

-- 4. Data Migration (Best Effort)
-- Update service_prices to point to the correct package_id based on code
-- (Assuming currently unique codes, this is safe. Future duplicates will be handled by UI insertion)
UPDATE service_prices sp
SET package_id = p.id
FROM service_packages p
WHERE sp.package_code = p.code;

-- 5. Cleanup
ALTER TABLE service_prices ALTER COLUMN package_id SET NOT NULL;
-- We can keep package_code in service_prices for reference or legacy, but package_id is now the link.
-- Let's drop package_code to force us to update the code and avoid sync issues.
ALTER TABLE service_prices DROP COLUMN package_code;
