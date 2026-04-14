insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app612_aislekin_public',
  'app612_aislekin_public',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app612_aislekin_private',
  'app612_aislekin_private',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "app612_aislekin_public_read" on storage.objects;
create policy "app612_aislekin_public_read"
on storage.objects
for select
to public
using (bucket_id = 'app612_aislekin_public');

drop policy if exists "app612_aislekin_public_write" on storage.objects;
create policy "app612_aislekin_public_write"
on storage.objects
for all
to authenticated
using (bucket_id = 'app612_aislekin_public')
with check (bucket_id = 'app612_aislekin_public');

drop policy if exists "app612_aislekin_private_read" on storage.objects;
create policy "app612_aislekin_private_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'app612_aislekin_private'
  and (storage.foldername(name))[1] = 'households'
  and app612_aislekin_is_member(((storage.foldername(name))[2])::uuid)
);

drop policy if exists "app612_aislekin_private_insert" on storage.objects;
create policy "app612_aislekin_private_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'app612_aislekin_private'
  and (storage.foldername(name))[1] = 'households'
  and app612_aislekin_is_member(((storage.foldername(name))[2])::uuid)
);

drop policy if exists "app612_aislekin_private_update" on storage.objects;
create policy "app612_aislekin_private_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'app612_aislekin_private'
  and (storage.foldername(name))[1] = 'households'
  and app612_aislekin_is_member(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'app612_aislekin_private'
  and (storage.foldername(name))[1] = 'households'
  and app612_aislekin_is_member(((storage.foldername(name))[2])::uuid)
);

drop policy if exists "app612_aislekin_private_delete" on storage.objects;
create policy "app612_aislekin_private_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'app612_aislekin_private'
  and (storage.foldername(name))[1] = 'households'
  and app612_aislekin_is_member(((storage.foldername(name))[2])::uuid)
);