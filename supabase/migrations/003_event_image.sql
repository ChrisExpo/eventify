-- Aggiunge campo image_url alla tabella events
alter table events add column image_url text;

-- Crea bucket storage per le immagini evento
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Policy storage: chiunque può leggere
create policy "event_images_select" on storage.objects for select
  using (bucket_id = 'event-images');

-- Policy storage: chiunque può inserire (anon - l'app non ha auth)
create policy "event_images_insert" on storage.objects for insert
  with check (bucket_id = 'event-images');

-- Policy storage: chiunque può aggiornare
create policy "event_images_update" on storage.objects for update
  using (bucket_id = 'event-images');

-- Policy storage: chiunque può eliminare
create policy "event_images_delete" on storage.objects for delete
  using (bucket_id = 'event-images');
