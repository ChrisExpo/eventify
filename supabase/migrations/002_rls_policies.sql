-- Enable RLS
alter table events enable row level security;
alter table participants enable row level security;
alter table items enable row level security;
alter table expenses enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;

-- Events
create policy "events_select" on events for select using (true);
create policy "events_insert" on events for insert with check (true);
create policy "events_update" on events for update using (true);
create policy "events_delete" on events for delete using (true);

-- Participants
create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (true);
create policy "participants_update" on participants for update using (true);

-- Items
create policy "items_select" on items for select using (true);
create policy "items_insert" on items for insert with check (true);
create policy "items_update" on items for update using (true);
create policy "items_delete" on items for delete using (true);

-- Expenses
create policy "expenses_select" on expenses for select using (true);
create policy "expenses_insert" on expenses for insert with check (true);

-- Polls
create policy "polls_select" on polls for select using (true);
create policy "polls_insert" on polls for insert with check (true);

-- Poll Options
create policy "poll_options_select" on poll_options for select using (true);
create policy "poll_options_insert" on poll_options for insert with check (true);
create policy "poll_options_update" on poll_options for update using (true);
