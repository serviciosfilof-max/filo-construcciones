create extension if not exists pgcrypto;

create table if not exists public.client_access (
  client_id text primary key,
  client_name text not null,
  email text not null,
  phone text,
  project_id text not null,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists client_access_project_idx
  on public.client_access (project_id);

create unique index if not exists client_access_email_project_idx
  on public.client_access (email, project_id);

create table if not exists public.project_progress (
  project_id text primary key,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  current_stage text,
  next_step text,
  estimated_finish text,
  summary text,
  media_url text,
  stage_media jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.project_progress
  add column if not exists stage_media jsonb not null default '{}'::jsonb;

alter table public.client_access enable row level security;
alter table public.project_progress enable row level security;

drop policy if exists "Allow service role client access" on public.client_access;
create policy "Allow service role client access"
on public.client_access
for all
to service_role
using (true)
with check (true);

drop policy if exists "Allow service role project progress" on public.project_progress;
create policy "Allow service role project progress"
on public.project_progress
for all
to service_role
using (true)
with check (true);
