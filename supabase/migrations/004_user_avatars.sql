-- Bucket storage per avatar utente
insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;

-- Policy: chiunque può leggere
create policy "user_avatars_select" on storage.objects for select
  using (bucket_id = 'user-avatars');

-- Policy: chiunque può caricare
create policy "user_avatars_insert" on storage.objects for insert
  with check (bucket_id = 'user-avatars');

-- Policy: chiunque può aggiornare
create policy "user_avatars_update" on storage.objects for update
  using (bucket_id = 'user-avatars');

-- Policy: chiunque può eliminare
create policy "user_avatars_delete" on storage.objects for delete
  using (bucket_id = 'user-avatars');
