alter table public.employees
drop constraint if exists employees_role_check;

alter table public.employees
add constraint employees_role_check
check (role in ('admin', 'supervisor', 'tecnico_vertical', 'operario', 'administrativo'));

