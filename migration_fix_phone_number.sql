-- Fix phone number in site_settings
INSERT INTO site_settings (key, value)
VALUES ('intro_contact_phone', '+48 508 020 612')
ON CONFLICT (key) 
DO UPDATE SET value = '+48 508 020 612';
