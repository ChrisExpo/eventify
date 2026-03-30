-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  emoji text not null default '🎉',
  category text not null default 'altro',
  date timestamptz not null,
  location_name text,
  location_url text,
  creator_name text not null,
  creator_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_slug on events(slug);

-- Participants
create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  status text not null check (status in ('confirmed', 'maybe', 'declined')),
  token text not null,
  created_at timestamptz not null default now(),
  unique(event_id, name)
);

create index idx_participants_event_id on participants(event_id);

-- Items (chi porta cosa)
create table items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  assigned_to text,
  created_at timestamptz not null default now()
);

create index idx_items_event_id on items(event_id);

-- Expenses (Phase 2 ma creiamo ora)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  paid_by text not null,
  split_among text[] not null,
  created_at timestamptz not null default now()
);

create index idx_expenses_event_id on expenses(event_id);

-- Polls (Phase 2 ma creiamo ora)
create table polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question text not null,
  type text not null check (type in ('single', 'multiple')),
  created_at timestamptz not null default now()
);

create index idx_polls_event_id on polls(event_id);

-- Poll Options
create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  votes text[] not null default '{}'
);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on events
  for each row execute function update_updated_at();
