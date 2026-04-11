create table if not exists public.employees (
  employee_id text primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'arquitecto', 'capataz', 'obrero')),
  shift text not null,
  email text not null unique,
  avatar_url text,
  qr_code text unique,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "Allow public read employees for demo" on public.employees;
create policy "Allow public read employees for demo"
on public.employees
for select
to anon, authenticated
using (true);

insert into public.employees (employee_id, full_name, role, shift, email, avatar_url, qr_code)
values
  (
    'ADM-001',
    'Administrador Filo',
    'admin',
    '07:00-17:00',
    'admin@filo.local',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    'CTLOGIN|ADM-001|admin@filo.local|admin'
  )
on conflict (employee_id) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  shift = excluded.shift,
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  qr_code = excluded.qr_code;

insert into public.employees (employee_id, full_name, role, shift, email, avatar_url, qr_code)
values
  (
    'ARQ-001',
    'Arq. Roberto Solis',
    'arquitecto',
    '07:00-15:00',
    'roberto.solis@construtrack.com',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    'CTLOGIN|ARQ-001|roberto.solis@construtrack.com|arquitecto'
  ),
  (
    'CAP-042',
    'Juan Perez',
    'capataz',
    '08:00-17:00',
    'juan.perez@construtrack.com',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
    'CTLOGIN|CAP-042|juan.perez@construtrack.com|capataz'
  ),
  (
    'OBR-105',
    'Miguel Angel',
    'obrero',
    '09:00-18:00',
    'miguel.angel@construtrack.com',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel',
    'CTLOGIN|OBR-105|miguel.angel@construtrack.com|obrero'
  )
on conflict (employee_id) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  shift = excluded.shift,
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  qr_code = excluded.qr_code;
