create table if not exists public.project_records (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.project_records enable row level security;

drop policy if exists "Project records are readable" on public.project_records;
create policy "Project records are readable"
  on public.project_records for select
  using (true);

drop policy if exists "Project records can be inserted" on public.project_records;
create policy "Project records can be inserted"
  on public.project_records for insert
  with check (true);

drop policy if exists "Project records can be updated" on public.project_records;
create policy "Project records can be updated"
  on public.project_records for update
  using (true)
  with check (true);

drop policy if exists "Project records can be deleted" on public.project_records;
create policy "Project records can be deleted"
  on public.project_records for delete
  using (true);
