-- Aggiungi stato evento
alter table events add column event_status text not null default 'confirmed';

-- Gli eventi con date_mode='flexible' e senza date confermata diventano 'draft'
update events set event_status = 'draft'
  where date_mode = 'flexible' and date is null;
