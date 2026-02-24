-- Add individual_color column to store actual paint name for cars with color_code = 490
ALTER TABLE stock_units ADD COLUMN IF NOT EXISTS individual_color text;
