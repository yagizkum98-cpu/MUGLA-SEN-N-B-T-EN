create table if not exists public.citizen_records (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.citizen_records enable row level security;

drop policy if exists "Citizen records are readable" on public.citizen_records;
create policy "Citizen records are readable"
  on public.citizen_records for select
  using (true);

drop policy if exists "Citizen records can be inserted" on public.citizen_records;
create policy "Citizen records can be inserted"
  on public.citizen_records for insert
  with check (true);

drop policy if exists "Citizen records can be updated" on public.citizen_records;
create policy "Citizen records can be updated"
  on public.citizen_records for update
  using (true)
  with check (true);

drop policy if exists "Citizen records can be deleted" on public.citizen_records;
create policy "Citizen records can be deleted"
  on public.citizen_records for delete
  using (true);
