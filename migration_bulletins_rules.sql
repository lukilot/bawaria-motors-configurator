-- Migration: Convert bulletins from single-discount to multi-rule structure
-- Run this AFTER the original migration_add_bulletins.sql

-- Add the rules JSONB column
ALTER TABLE bulletins ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: convert old flat columns into a single rule entry in the rules array
UPDATE bulletins
SET rules = jsonb_build_array(
    jsonb_build_object(
        'model_codes', COALESCE(model_codes, ARRAY[]::TEXT[]),
        'body_groups', COALESCE(body_groups, ARRAY[]::TEXT[]),
        'production_year_min', production_year_min,
        'production_year_max', production_year_max,
        'discount_amount', COALESCE(discount_amount, 0),
        'discount_percent', COALESCE(discount_percent, 0)
    )
)
WHERE rules = '[]'::jsonb
  AND (discount_amount > 0 OR discount_percent > 0);

-- Drop old columns (they are now inside rules JSONB)
ALTER TABLE bulletins DROP COLUMN IF EXISTS model_codes;
ALTER TABLE bulletins DROP COLUMN IF EXISTS body_groups;
ALTER TABLE bulletins DROP COLUMN IF EXISTS production_year_min;
ALTER TABLE bulletins DROP COLUMN IF EXISTS production_year_max;
ALTER TABLE bulletins DROP COLUMN IF EXISTS discount_amount;d
ALTER TABLE bulletins DROP COLUMN IF EXISTS discount_percent;
