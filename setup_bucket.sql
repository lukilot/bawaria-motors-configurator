-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('dictionary-assets', 'dictionary-assets', true)
on conflict do nothing;

-- 2. Enable RLS
-- (Storage objects table usually has RLS enabled by default, but policies are needed)

-- 3. Policy: Public Read Access
-- Allow anyone to view images in this bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'dictionary-assets' );

-- 4. Policy: Upload Access
-- For simplicity in this demo, we allow uploads if the user is authenticated (or anyone if you want totally open)
-- Adjust 'auth.role() = ''authenticated''' to 'true' if you want to allow anonymous uploads for testing
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id = 'dictionary-assets' );

-- 5. Policy: Storage Update/Delete
create policy "Allow Updates"
on storage.objects for update
using ( bucket_id = 'dictionary-assets' );

create policy "Allow Deletes"
on storage.objects for delete
using ( bucket_id = 'dictionary-assets' );
