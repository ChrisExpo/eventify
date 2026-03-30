-- Rendi la data opzionale
alter table events alter column date drop not null;

-- Aggiungi data fine per archi temporali
alter table events add column date_end timestamptz;
