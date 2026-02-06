-- 1. Create the bucket (safe if exists)
insert into storage.buckets (id, name, public)
values ('dictionary-assets', 'dictionary-assets', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid "already exists" errors
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow Uploads" on storage.objects;
drop policy if exists "Allow Updates" on storage.objects;
drop policy if exists "Allow Deletes" on storage.objects;

-- 3. Re-create Policy: Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'dictionary-assets' );

-- 4. Re-create Policy: Upload Access
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id = 'dictionary-assets' );

-- 5. Re-create Policy: Storage Update/Delete
create policy "Allow Updates"
on storage.objects for update
using ( bucket_id = 'dictionary-assets' );

create policy "Allow Deletes"
on storage.objects for delete
using ( bucket_id = 'dictionary-assets' );
