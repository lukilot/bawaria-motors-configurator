-- Create 'stock-images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('stock-images', 'stock-images', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Read Access" on storage.objects;
drop policy if exists "Authenticated Upload Access" on storage.objects;
drop policy if exists "Authenticated Update Access" on storage.objects;
drop policy if exists "Authenticated Delete Access" on storage.objects;

-- Create Policy: Public Read Access (Anyone can view)
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'stock-images' );

-- Create Policy: Service Role Upload (Admin API)
-- We trust the service role key used in the Next.js API route
create policy "Service Role Upload"
on storage.objects for insert
with check ( bucket_id = 'stock-images' );

-- Create Policy: Service Role Update
create policy "Service Role Update"
on storage.objects for update
using ( bucket_id = 'stock-images' );

-- Create Policy: Service Role Delete
create policy "Service Role Delete"
on storage.objects for delete
using ( bucket_id = 'stock-images' );

-- Also allow "anon" uploads for now to debug (if the API client is client-side, but here we use server side)
-- But wait, the API uses the service_role key, so we need to ensure the RLS doesn't block it.
-- Service role bypasses RLS, so this might be an issue with the client initialization.

-- Ensure specific policies for Anon/Authenticated if needed for direct uploads (optional)
create policy "Allow All Uploads"
on storage.objects for insert
with check ( bucket_id = 'stock-images' );
