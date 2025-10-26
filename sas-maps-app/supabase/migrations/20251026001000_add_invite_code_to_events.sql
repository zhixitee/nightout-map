alter table public.events
  add column if not exists invite_code text unique;

-- Backfill invite_code for existing rows if missing
update public.events
set invite_code = md5(gen_random_uuid()::text)
where invite_code is null;

alter table public.events
  alter column invite_code set not null;