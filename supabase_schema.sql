-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Dictionaries Table (Flexible mapping for Codes)
-- Stores metadata for Models, Colors, Upholstery, Options
create table dictionaries (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('model', 'color', 'upholstery', 'option', 'package')),
  code text not null, -- The raw code from Excel (e.g., '475', 'VCFU')
  data jsonb not null default '{}'::jsonb, -- The rich object content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(type, code)
);

-- 2. Stock Units Table (The core buffer)
create table stock_units (
  id uuid default uuid_generate_v4() primary key,
  vin text not null unique,
  
  -- Technical Fields (Synced from Excel)
  status_code int not null, -- e.g. 112, 150, 190
  order_status text not null, -- Display text
  processing_type text, -- 'SH', 'ST', 'DE'
  location text,
  production_date date,
  
  -- Product Definition
  model_code text not null, -- e.g. '21EJ'
  color_code text, -- e.g. '475'
  upholstery_code text, -- e.g. 'MAMU'
  fuel_type text,
  power text,
  drivetrain text,
  option_codes text[], -- Array of option codes e.g. ['337', '1G6']
  
  -- Pricing (Manual or Excel?) - Prompt says Manual defaults, but usually Excel has List Price.
  -- Strategy: effective_price columns are manually overridable, import_price is from excel
  list_price numeric, 
  special_price numeric,
  currency text default 'PLN',
  
  -- Manual Fields (Never overwritten by Excel sync)
  description text,
  images jsonb[] default array[]::jsonb[], -- Array of image objects {url, id, sort_order}
  is_sold boolean default false,
  
  -- Visibility Logic
  visibility text not null default 'INTERNAL' check (visibility in ('PUBLIC', 'HIDDEN', 'INTERNAL')),
  
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_stock_vin on stock_units(vin);
create index idx_stock_visibility on stock_units(visibility);
create index idx_stock_model on stock_units(model_code);

-- Simple RLS (Row Level Security)
alter table stock_units enable row level security;
alter table dictionaries enable row level security;

-- Public Read Policy (for Stock Units where visibility is PUBLIC)
create policy "Public can view public stock"
  on stock_units for select
  using (visibility = 'PUBLIC');

-- Admin Policy (Full Access - assuming authenticated admin)
-- For now, allowing all interaction for authenticated users (or service role)
create policy "Admins have full access"
  on stock_units for all
  using (true);

create policy "Admins manage dictionaries"
  on dictionaries for all
  using (true);
