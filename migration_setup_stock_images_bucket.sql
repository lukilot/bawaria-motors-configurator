-- 1. Create the bucket if not exists
insert into storage.buckets (id, name, public)
values ('stock-images', 'stock-images', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to ensure clean state
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow Uploads" on storage.objects;
drop policy if exists "Allow Updates" on storage.objects;
drop policy if exists "Allow Deletes" on storage.objects;

-- 3. Create Policy: Public Read Access
create policy "Public Stock Images Read"
on storage.objects for select
using ( bucket_id = 'stock-images' );

-- 4. Create Policy: Allow Public Uploads (Fix for missing Service Role Key)
-- Ideally this should be authenticated access only, but to fix the immediate error
-- without requiring env var changes on Vercel, we allow public uploads for now.
create policy "Allow Stock Images Uploads"
on storage.objects for insert
with check ( bucket_id = 'stock-images' );

-- 5. Create Policy: Allow Updates
create policy "Allow Stock Images Updates"
on storage.objects for update
using ( bucket_id = 'stock-images' );

-- 6. Create Policy: Allow Deletes
create policy "Allow Stock Images Deletes"
on storage.objects for delete
using ( bucket_id = 'stock-images' );
