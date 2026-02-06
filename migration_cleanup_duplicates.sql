-- Cleanup Duplicate Packages (Remove '07' prefixed codes)
-- This will automatically remove associated prices due to ON DELETE CASCADE

DELETE FROM service_packages 
WHERE code LIKE '07%';
