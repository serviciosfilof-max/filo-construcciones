create extension if not exists pgcrypto;

create table if not exists public.work_projects (
  id text primary key,
  name text not null,
  location text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  budget text,
  access_code text not null,
  status text,
  state text not null default 'activa' check (state in ('activa', 'pausada', 'suspendida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_supplies (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.work_projects(id) on delete cascade,
  name text not null,
  stock numeric not null default 0,
  unit text,
  status text not null default 'OK',
  assigned_role text not null default 'todos',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.work_projects(id) on delete cascade,
  category text not null default 'Insumos',
  detail text not null,
  amount numeric not null default 0,
  kind text not null default 'presupuesto' check (kind in ('presupuesto', 'costo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_projects enable row level security;
alter table public.project_supplies enable row level security;
alter table public.project_budget_items enable row level security;

drop policy if exists "Allow service role work projects" on public.work_projects;
create policy "Allow service role work projects"
on public.work_projects
for all
to service_role
using (true)
with check (true);

drop policy if exists "Allow service role project supplies" on public.project_supplies;
create policy "Allow service role project supplies"
on public.project_supplies
for all
to service_role
using (true)
with check (true);

drop policy if exists "Allow service role project budget items" on public.project_budget_items;
create policy "Allow service role project budget items"
on public.project_budget_items
for all
to service_role
using (true)
with check (true);

insert into public.work_projects (id, name, location, progress, budget, access_code, status, state)
values
  ('ALT-001', 'Fachada vertical Norte', 'CABA, Buenos Aires', 68, '$4.8M', 'FILO-ALT-001', 'Pintura y sellado', 'activa'),
  ('VID-002', 'Limpieza de vidrios en altura', 'Vicente Lopez, Buenos Aires', 35, '$1.6M', 'FILO-VID-002', 'En preparacion', 'activa'),
  ('IMP-003', 'Terraza con filtraciones', 'San Isidro, Buenos Aires', 20, '$2.9M', 'FILO-IMP-003', 'Armado de insumos', 'activa'),
  ('CAR-004', 'Carteleria exterior', 'Palermo, Buenos Aires', 12, '$1.2M', 'FILO-CAR-004', 'Relevamiento', 'activa')
on conflict (id) do nothing;
