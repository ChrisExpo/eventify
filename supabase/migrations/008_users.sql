create table users (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_device_id on users(device_id);

-- RLS
alter table users enable row level security;
create policy "users_select" on users for select using (true);
create policy "users_insert" on users for insert with check (true);
create policy "users_update" on users for update using (true);
create policy "users_delete" on users for delete using (true);

-- Trigger updated_at
create trigger set_users_updated_at
  before update on users
  for each row execute function update_updated_at();
