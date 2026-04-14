-- Create the missing scrape_log table
-- Run this in Supabase SQL Editor

create table if not exists scrape_log (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  started_at    timestamptz default now(),
  finished_at   timestamptz,
  jobs_found    int default 0,
  jobs_inserted int default 0,
  jobs_updated  int default 0,
  jobs_expired  int default 0,
  error         text,
  status        text default 'running'
);

create index if not exists idx_scrape_log_status on scrape_log(status);
create index if not exists idx_scrape_log_started on scrape_log(started_at desc);

-- Enable RLS
alter table scrape_log enable row level security;

-- Service role only for scrape_log (no public access)
drop policy if exists "Service role read scrape_log" on scrape_log;
create policy "Service role read scrape_log"
  on scrape_log for select
  using (auth.role() = 'service_role');
