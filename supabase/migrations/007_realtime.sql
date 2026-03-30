-- Abilita Realtime sulle tabelle necessarie
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_options;
