create table if not exists public.employees (
  employee_id text primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'supervisor', 'tecnico_vertical', 'operario', 'administrativo')),
  shift text not null,
  email text not null unique,
  avatar_url text,
  qr_code text unique,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

alter table public.employees
drop constraint if exists employees_role_check;

alter table public.employees
add constraint employees_role_check
check (role in ('admin', 'supervisor', 'tecnico_vertical', 'operario', 'administrativo'));

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

delete from public.employees
where employee_id in ('ARQ-001', 'CAP-042', 'OBR-105')
   or role in ('arquitecto', 'capataz', 'obrero');
