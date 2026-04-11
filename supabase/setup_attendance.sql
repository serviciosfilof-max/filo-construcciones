create extension if not exists pgcrypto;

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees(employee_id) on delete cascade,
  project_id text not null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  status text not null check (status in ('in', 'out')),
  qr_payload text not null,
  created_at timestamptz not null default now()
);

create index if not exists attendance_sessions_employee_project_idx
  on public.attendance_sessions (employee_id, project_id, check_in_at desc);

alter table public.attendance_sessions enable row level security;

drop policy if exists "Allow public read attendance for demo" on public.attendance_sessions;
create policy "Allow public read attendance for demo"
on public.attendance_sessions
for select
to anon, authenticated
using (true);

drop policy if exists "Allow public insert attendance for demo" on public.attendance_sessions;
create policy "Allow public insert attendance for demo"
on public.attendance_sessions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public update attendance for demo" on public.attendance_sessions;
create policy "Allow public update attendance for demo"
on public.attendance_sessions
for update
to anon, authenticated
using (true)
with check (true);
