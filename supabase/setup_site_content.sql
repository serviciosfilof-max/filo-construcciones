create table if not exists public.site_content (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at
before update on public.site_content
for each row
execute function public.set_site_content_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Allow public read site content" on public.site_content;
create policy "Allow public read site content"
on public.site_content
for select
to anon, authenticated
using (true);

insert into public.site_content (id, content)
values (
  'main',
  '{
    "logoUrl": "https://cdn.shopify.com/s/files/1/0995/6432/3185/files/FILO.png?v=1775935955"
  }'::jsonb
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update
set public = true;
