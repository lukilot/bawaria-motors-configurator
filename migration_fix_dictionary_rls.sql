-- FIX: Grant permissions to 'dictionary-assets' bucket to allow server-side operations via Anon Key
-- (Required since SUPABASE_SERVICE_ROLE_KEY is missing in environment)

-- 1. Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('dictionary-assets', 'dictionary-assets', true)
on conflict (id) do nothing;

-- 2. Clean up old policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects; -- Drop generic ones if they conflict
drop policy if exists "Allow Uploads" on storage.objects;
drop policy if exists "Allow Updates" on storage.objects;
drop policy if exists "Allow Deletes" on storage.objects;

drop policy if exists "Dictionary Public Select" on storage.objects;
drop policy if exists "Dictionary Public Insert" on storage.objects;
drop policy if exists "Dictionary Public Update" on storage.objects;
drop policy if exists "Dictionary Public Delete" on storage.objects;

-- 3. Create Explicit Permissive Policies for 'dictionary-assets'

-- READ: Everyone can view images
create policy "Dictionary Public Select"
on storage.objects for select
using ( bucket_id = 'dictionary-assets' );

-- INSERT: Allow uploads (needed for API route using Anon key)
create policy "Dictionary Public Insert"
on storage.objects for insert
with check ( bucket_id = 'dictionary-assets' );

-- UPDATE: Allow overwriting images
create policy "Dictionary Public Update"
on storage.objects for update
using ( bucket_id = 'dictionary-assets' );

-- DELETE: Allow removing images (needed for API route using Anon key)
create policy "Dictionary Public Delete"
on storage.objects for delete
using ( bucket_id = 'dictionary-assets' );
