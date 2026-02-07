-- Create 'stock-images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('stock-images', 'stock-images', true)
on conflict (id) do nothing;

-- 1. Public Read Access
create policy "Stock Images Public Read"
on storage.objects for select
using ( bucket_id = 'stock-images' );

-- 2. Authenticated/Service Role Upload
-- using 'true' to ensure the Service Role (which bypasses RLS anyway) and authenticated users can work.
-- If Service Role bypasses RLS, we techincally don't need this for the backend script, 
-- BUT valid RLS is good practice incase the client uses it.
create policy "Stock Images Upload"
on storage.objects for insert
with check ( bucket_id = 'stock-images' );

-- 3. Update Access
create policy "Stock Images Update"
on storage.objects for update
using ( bucket_id = 'stock-images' );

-- 4. Delete Access
create policy "Stock Images Delete"
on storage.objects for delete
using ( bucket_id = 'stock-images' );
