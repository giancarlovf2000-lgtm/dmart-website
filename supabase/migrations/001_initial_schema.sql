-- ============================================================
-- D'Mart Institute — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CAMPUSES
-- ============================================================
create table if not exists campuses (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null,
  slug        text not null unique,
  address     text not null,
  city        text not null,
  state       text not null default 'PR',
  zip         text not null,
  phone       text not null,
  email       text,
  active      boolean not null default true
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  name        text not null,
  slug        text not null unique,
  description text,
  color       text,          -- hex color for UI
  icon        text,          -- lucide icon name
  sort_order  int not null default 0
);

-- ============================================================
-- PROGRAMS
-- ============================================================
create table if not exists programs (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  category_id     uuid not null references categories(id) on delete restrict,
  name            text not null,
  slug            text not null unique,
  description     text,
  duration_weeks  int,
  credits         numeric(5,1),
  hours           int,
  schedule_options text[],   -- e.g. ['Diurno','Nocturno','Sabatino']
  active          boolean not null default true,
  sort_order      int not null default 0
);

-- ============================================================
-- PROGRAM_CAMPUSES (many-to-many)
-- ============================================================
create table if not exists program_campuses (
  id          uuid primary key default uuid_generate_v4(),
  program_id  uuid not null references programs(id) on delete cascade,
  campus_id   uuid not null references campuses(id) on delete cascade,
  unique(program_id, campus_id)
);

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists leads (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  nombre            text not null,
  apellido          text not null,
  email             text not null,
  telefono          text not null,
  campus            text,          -- 'Barranquitas' | 'Vega Alta' | 'Ambos'
  programa_interes  text,
  horario           text,          -- 'Diurno' | 'Nocturno' | 'Sabatino'
  source            text,          -- referrer domain or 'direct'
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  page_source       text,          -- the page path where form was submitted
  status            text not null default 'new',  -- new | contacted | enrolled | closed
  notes             text
);

-- ============================================================
-- DOCUMENTS (catalog, brochures, etc.)
-- ============================================================
create table if not exists documents (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  title       text not null,
  description text,
  file_url    text not null,
  category    text,          -- 'catalogo' | 'folleto' | 'formulario'
  language    text default 'es',
  active      boolean not null default true,
  sort_order  int not null default 0
);

-- ============================================================
-- SITE_SETTINGS (key/value store for easy content management)
-- ============================================================
create table if not exists site_settings (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  key         text not null unique,
  value       text,
  description text
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger campuses_updated_at
  before update on campuses
  for each row execute function update_updated_at_column();

create trigger programs_updated_at
  before update on programs
  for each row execute function update_updated_at_column();

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at_column();

create trigger site_settings_updated_at
  before update on site_settings
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table campuses        enable row level security;
alter table categories      enable row level security;
alter table programs        enable row level security;
alter table program_campuses enable row level security;
alter table leads           enable row level security;
alter table documents       enable row level security;
alter table site_settings   enable row level security;

-- Public read access for content tables
create policy "Public read campuses"
  on campuses for select using (active = true);

create policy "Public read categories"
  on categories for select using (true);

create policy "Public read programs"
  on programs for select using (active = true);

create policy "Public read program_campuses"
  on program_campuses for select using (true);

create policy "Public read documents"
  on documents for select using (active = true);

create policy "Public read site_settings"
  on site_settings for select using (true);

-- Leads: anonymous insert only (no read-back for anon)
create policy "Anonymous insert leads"
  on leads for insert with check (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_programs_category on programs(category_id);
create index if not exists idx_programs_slug on programs(slug);
create index if not exists idx_program_campuses_program on program_campuses(program_id);
create index if not exists idx_program_campuses_campus on program_campuses(campus_id);
create index if not exists idx_leads_created_at on leads(created_at desc);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_campus on leads(campus);
