-- SERVICE PACKAGES MIGRATION (Consolidated)

-- 1. Ensure vehicle_type column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'vehicle_type') THEN
        ALTER TABLE service_packages 
        ADD COLUMN vehicle_type text NOT NULL DEFAULT 'ALL' CHECK (vehicle_type IN ('ALL', 'ELECTRIC', 'ICE_PHEV'));
    END IF;
END $$;

-- 2. Ensure ID column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'id') THEN
        ALTER TABLE service_packages ADD COLUMN id uuid DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 3. Update Primary Key to ID (if not already)
DO $$ 
BEGIN 
    -- Check if PK is 'id'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name 
        WHERE tc.table_name = 'service_packages' AND tc.constraint_type = 'PRIMARY KEY' AND ccu.column_name = 'id'
    ) THEN
        -- Drop old PK (likely on 'code')
        ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_pkey CASCADE;
        -- Set new PK
        ALTER TABLE service_packages ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 4. Add Unique Constraint on (code, vehicle_type)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_packages_code_type_key') THEN
        ALTER TABLE service_packages ADD CONSTRAINT service_packages_code_type_key UNIQUE (code, vehicle_type);
    END IF;
END $$;

-- 5. Update service_prices to use package_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_prices' AND column_name = 'package_id') THEN
        ALTER TABLE service_prices ADD COLUMN package_id uuid REFERENCES service_packages(id) ON DELETE CASCADE;
        
        -- Data Migration: Link prices to packages by code
        -- Note: If duplicate codes exist (e.g. Electric/ICE split), this might be ambiguous, 
        -- but currently we likely only have unique codes or non-conflicting setups.
        UPDATE service_prices sp
        SET package_id = p.id
        FROM service_packages p
        WHERE sp.package_code = p.code;
        
        ALTER TABLE service_prices ALTER COLUMN package_id SET NOT NULL;
    END IF;
END $$;

-- 6. Remove old package_code reference from service_prices (Optional cleanup)
-- ALTER TABLE service_prices DROP COLUMN IF EXISTS package_code;
