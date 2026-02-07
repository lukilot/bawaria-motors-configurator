-- Create table if not exists
create table if not exists site_settings (
    key text primary key,
    value text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table site_settings enable row level security;

-- Drop existing policies to avoid conflicts (using IF EXISTS)
drop policy if exists "Enable read access for all users" on site_settings;
drop policy if exists "Enable insert for authenticated users only" on site_settings;
drop policy if exists "Enable update for authenticated users only" on site_settings;
drop policy if exists "Public Read Settings" on site_settings;
drop policy if exists "Allow Admin Upsert" on site_settings;
drop policy if exists "Allow Admin Update" on site_settings;
drop policy if exists "Allow Admin Delete" on site_settings;

-- 1. Read Access (Public)
create policy "Public Read Settings"
on site_settings for select
using ( true );

-- 2. Insert/Update Access (Admin/Authenticated)
create policy "Allow Admin Upsert"
on site_settings for insert
with check ( true ); 

create policy "Allow Admin Update"
on site_settings for update
using ( true );

-- 3. Delete Access (Optional)
create policy "Allow Admin Delete"
on site_settings for delete
using ( true );
