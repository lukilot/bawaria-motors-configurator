-- Add vehicle_type column to service_packages
ALTER TABLE service_packages 
ADD COLUMN vehicle_type text NOT NULL DEFAULT 'ALL' CHECK (vehicle_type IN ('ALL', 'ELECTRIC', 'ICE_PHEV'));

-- Update existing packages
-- Assuming existing BRIs are for ICE unless specified
-- (User will need to manually update them in Admin UI, or we default to ALL)

-- Optional: Create an index if we filter often (not really needed for small table)
