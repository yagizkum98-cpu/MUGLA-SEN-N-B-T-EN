create table if not exists public.annual_theme_settings (
  year text primary key,
  themes jsonb not null default '["all"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.annual_theme_settings enable row level security;

drop policy if exists "Annual theme settings are readable" on public.annual_theme_settings;
create policy "Annual theme settings are readable"
  on public.annual_theme_settings for select
  using (true);

drop policy if exists "Annual theme settings can be inserted" on public.annual_theme_settings;
create policy "Annual theme settings can be inserted"
  on public.annual_theme_settings for insert
  with check (true);

drop policy if exists "Annual theme settings can be updated" on public.annual_theme_settings;
create policy "Annual theme settings can be updated"
  on public.annual_theme_settings for update
  using (true)
  with check (true);
