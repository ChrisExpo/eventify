-- Aggiunge campi a items per prezzo e scontrino
alter table items add column amount numeric(10,2);
alter table items add column receipt_url text;

-- Bucket storage per gli scontrini
insert into storage.buckets (id, name, public)
values ('item-receipts', 'item-receipts', true)
on conflict (id) do nothing;

create policy "item_receipts_select" on storage.objects for select
  using (bucket_id = 'item-receipts');
create policy "item_receipts_insert" on storage.objects for insert
  with check (bucket_id = 'item-receipts');
create policy "item_receipts_update" on storage.objects for update
  using (bucket_id = 'item-receipts');
create policy "item_receipts_delete" on storage.objects for delete
  using (bucket_id = 'item-receipts');
