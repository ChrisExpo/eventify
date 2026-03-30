-- Push subscriptions: one row per (device, event) pair.
-- The endpoint uniquely identifies a browser push subscription on a device.
create table push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references events(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique(event_id, endpoint)
);

create index idx_push_subs_event_id on push_subscriptions(event_id);

alter table push_subscriptions enable row level security;
create policy "push_subs_select" on push_subscriptions for select using (true);
create policy "push_subs_insert" on push_subscriptions for insert with check (true);
create policy "push_subs_delete" on push_subscriptions for delete using (true);

-- Notification log: tracks which reminder type has already been dispatched for each event
-- so the cron job never sends the same reminder twice.
create table notification_log (
  id       uuid        primary key default gen_random_uuid(),
  event_id uuid        not null references events(id) on delete cascade,
  type     text        not null check (type in ('24h', '2h')),
  sent_at  timestamptz not null default now(),
  unique(event_id, type)
);

alter table notification_log enable row level security;
create policy "notif_log_select" on notification_log for select using (true);
create policy "notif_log_insert" on notification_log for insert with check (true);
