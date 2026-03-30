-- Aggiungi campi per date flessibili
alter table events add column date_mode text not null default 'fixed';
alter table events add column flexible_week_start date;

-- Tabella voti per date flessibili
create table date_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  date_option date not null,
  voter_name text not null,
  created_at timestamptz not null default now(),
  unique(event_id, date_option, voter_name)
);

create index idx_date_votes_event_id on date_votes(event_id);

-- RLS
alter table date_votes enable row level security;
create policy "date_votes_select" on date_votes for select using (true);
create policy "date_votes_insert" on date_votes for insert with check (true);
create policy "date_votes_delete" on date_votes for delete using (true);
