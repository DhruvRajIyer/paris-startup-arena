-- ═══════════════════════════════════════════════════════════════
-- PARIS STARTUP ARENA · DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────
create table if not exists companies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  sector          text not null,
  logo_initials   text,
  logo_url        text,
  lat             float8 not null,
  lng             float8 not null,
  arrondissement  int,
  address         text,
  funding_stage   text,
  founded_year    int,
  employee_count  text,
  website         text,
  linkedin_url    text,
  description     text,
  is_verified     boolean default false,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_companies_sector on companies(sector);
create index if not exists idx_companies_active on companies(is_active);
create index if not exists idx_companies_arrond on companies(arrondissement);
create index if not exists idx_companies_lat_lng on companies(lat, lng);
create index if not exists idx_companies_slug on companies(slug);

-- ─────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────
create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  title           text not null,
  category        text not null,
  tags            text[] default '{}',
  salary_min      int,
  salary_max      int,
  salary_currency text default 'EUR',
  work_mode       text not null,
  description     text,
  requirements    text,
  apply_url       text not null,
  source          text default 'manual',
  source_id       text,
  is_featured     boolean default false,
  is_active       boolean default true,
  posted_at       timestamptz default now(),
  expires_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_jobs_company on jobs(company_id);
create index if not exists idx_jobs_category on jobs(category);
create index if not exists idx_jobs_active on jobs(is_active);
create index if not exists idx_jobs_posted on jobs(posted_at desc);
create index if not exists idx_jobs_source_id on jobs(source, source_id);
create index if not exists idx_jobs_featured on jobs(is_featured) where is_featured = true;

-- ─────────────────────────────────────────────
-- WAITLIST
-- ─────────────────────────────────────────────
create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  type        text not null default 'notify',
  created_at  timestamptz default now()
);

create index if not exists idx_waitlist_email on waitlist(email);
create index if not exists idx_waitlist_type on waitlist(type);

-- ─────────────────────────────────────────────
-- SCRAPE LOG
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- AUTO-UPDATE TRIGGERS
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_companies_updated on companies;
create trigger trg_companies_updated
  before update on companies
  for each row execute function set_updated_at();

drop trigger if exists trg_jobs_updated on jobs;
create trigger trg_jobs_updated
  before update on jobs
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- AUTO-EXPIRE JOBS FUNCTION
-- ─────────────────────────────────────────────
create or replace function expire_stale_jobs()
returns void as $$
begin
  update jobs
  set is_active = false
  where is_active = true
    and expires_at < now();
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table companies enable row level security;
alter table jobs enable row level security;
alter table waitlist enable row level security;
alter table scrape_log enable row level security;

-- Public read for active companies
drop policy if exists "Public read companies" on companies;
create policy "Public read companies"
  on companies for select
  using (is_active = true);

-- Public read for active jobs
drop policy if exists "Public read jobs" on jobs;
create policy "Public read jobs"
  on jobs for select
  using (is_active = true);

-- Allow anyone to insert into waitlist
drop policy if exists "Insert waitlist" on waitlist;
create policy "Insert waitlist"
  on waitlist for insert
  with check (true);

-- Service role only for scrape_log (no public access)
drop policy if exists "Service role read scrape_log" on scrape_log;
create policy "Service role read scrape_log"
  on scrape_log for select
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- HELPER VIEWS
-- ─────────────────────────────────────────────

-- View for companies with open role counts
create or replace view companies_with_roles as
select 
  c.*,
  count(j.id) as open_roles_count
from companies c
left join jobs j on j.company_id = c.id and j.is_active = true
where c.is_active = true
group by c.id;

-- View for jobs with company data (for API)
create or replace view jobs_with_company as
select 
  j.*,
  json_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'sector', c.sector,
    'logo_initials', c.logo_initials,
    'logo_url', c.logo_url,
    'lat', c.lat,
    'lng', c.lng,
    'arrondissement', c.arrondissement,
    'funding_stage', c.funding_stage
  ) as company
from jobs j
join companies c on c.id = j.company_id
where j.is_active = true and c.is_active = true;
