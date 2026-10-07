-- Run after project-records.sql in the shared Supabase project.
create sequence if not exists public.project_application_number_seq;
create index if not exists project_records_owner_year_idx
  on public.project_records ((lower(data->>'ownerEmail')), (data->>'applicationYear'))
  where data ? 'title';

create or replace function public.submit_project_application(p_project jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing jsonb;
  v_saved jsonb;
  v_id text := trim(p_project->>'id');
  v_owner text := lower(trim(p_project->>'ownerEmail'));
  v_year text := p_project->>'applicationYear';
  v_count integer;
  v_code text;
begin
  if coalesce(v_id, '') = '' or coalesce(v_owner, '') = '' or
     coalesce(p_project->>'ownerId', '') = '' or coalesce(p_project->>'title', '') = '' or
     coalesce(v_year, '') !~ '^[0-9]{4}$' then
    raise exception 'APPLICATION_INVALID';
  end if;
  -- Serialize retries and simultaneous submissions for the same person and year.
  perform pg_advisory_xact_lock(hashtextextended(v_owner || ':' || v_year, 0));
  select data into v_existing from public.project_records where id = v_id;
  if found then
    if coalesce((v_existing->>'deleted')::boolean, false) or
       lower(coalesce(v_existing->>'ownerEmail', '')) <> v_owner then
      raise exception 'APPLICATION_OWNER';
    end if;
    return v_existing;
  end if;
  select count(*) into v_count from public.project_records
    where data ? 'title' and coalesce((data->>'deleted')::boolean, false) = false
      and lower(data->>'ownerEmail') = v_owner
      and coalesce(data->>'applicationYear', left(data->>'createdAt', 4)) = v_year;
  if v_count >= 5 then raise exception 'APPLICATION_LIMIT'; end if;
  loop
    v_code := 'MSB-' || v_year || '-' || lpad(nextval('public.project_application_number_seq')::text, 6, '0');
    exit when not exists (select 1 from public.project_records where data->>'projectCode' = v_code);
  end loop;
  v_saved := p_project || jsonb_build_object(
    'projectCode', v_code, 'status', 'Başvuru', 'moderationStatus', 'Bekliyor',
    'workflowStatus', 'İlçe Admin İncelemesinde', 'source', 'citizen',
    'votes', 0, 'progress', 0, 'ownerEmail', v_owner,
    'createdAt', now(), 'updatedAt', now()
  );
  insert into public.project_records (id, data, updated_at) values (v_id, v_saved, now());
  return v_saved;
end;
$$;

revoke all on function public.submit_project_application(jsonb) from public, anon, authenticated;
grant execute on function public.submit_project_application(jsonb) to service_role;
grant usage, select on sequence public.project_application_number_seq to service_role;
