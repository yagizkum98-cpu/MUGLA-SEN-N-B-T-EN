create table if not exists public.contact_records (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.contact_records enable row level security;

drop policy if exists "Contact records are readable" on public.contact_records;
create policy "Contact records are readable"
  on public.contact_records for select
  using (true);

drop policy if exists "Contact records can be inserted" on public.contact_records;
create policy "Contact records can be inserted"
  on public.contact_records for insert
  with check (true);

drop policy if exists "Contact records can be updated" on public.contact_records;
create policy "Contact records can be updated"
  on public.contact_records for update
  using (true)
  with check (true);

drop policy if exists "Contact records can be deleted" on public.contact_records;
create policy "Contact records can be deleted"
  on public.contact_records for delete
  using (true);
