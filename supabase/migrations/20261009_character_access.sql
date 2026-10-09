-- Run after 20261009_pdf_editions_security.sql. Keeps all existing characters.
begin;
alter table public.characters enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='characters' loop
    execute format('drop policy %I on public.characters', p.policyname);
  end loop;
end $$;
revoke all on public.characters from anon, authenticated;
grant select, insert, update, delete on public.characters to authenticated;
create policy codex_character_read on public.characters for select to authenticated
  using (user_id = (select auth.uid()) or (select private.codex_admin()));
create policy codex_character_insert on public.characters for insert to authenticated
  with check ((user_id = (select auth.uid()) and status = 'pending' and not coalesce(is_in_session,false)
    and not coalesce(level_up_pending,false) and not coalesce(level_up_enabled,false)) or (select private.codex_admin()));
create policy codex_character_update on public.characters for update to authenticated
  using (user_id = (select auth.uid()) or (select private.codex_admin()))
  with check (user_id = (select auth.uid()) or (select private.codex_admin()));
create policy codex_character_delete on public.characters for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.codex_admin()));

create or replace function private.protect_character_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' or private.codex_admin() then return new; end if;
  if new.user_id is distinct from old.user_id or new.status is distinct from old.status
    or new.is_in_session is distinct from old.is_in_session
    or new.level_up_enabled is distinct from old.level_up_enabled
    or (new.level_up_pending is true and old.level_up_pending is distinct from true) then
    raise exception 'Only an administrator may change review or session permissions.' using errcode = '42501';
  end if;
  if new.level is distinct from old.level then
    if old.level_up_pending is not true or new.level <> old.level + 1 then
      raise exception 'Level increase not authorized.' using errcode = '42501';
    end if;
    new.level_up_pending := false;
  end if;
  return new;
end $$;
revoke all on function private.protect_character_review() from public, anon, authenticated;
drop trigger if exists codex_protect_character_review on public.characters;
create trigger codex_protect_character_review before update on public.characters
  for each row execute function private.protect_character_review();

-- Legacy SECURITY DEFINER RPCs must not bypass the policies above.
-- Keep approved UI RPCs as security invoker; revoke the maintenance/token RPCs.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature, p.proname
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and p.prokind='f' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
    if f.proname in ('get_all_characters_admin','admin_toggle_level_up','set_scenario_tags','get_scenario_tags','check_analytics_access') then
      execute format('alter function %s security invoker', f.signature);
      execute format('alter function %s set search_path = public, pg_temp', f.signature);
      execute format('grant execute on function %s to authenticated', f.signature);
      if f.proname='get_scenario_tags' then execute format('grant execute on function %s to anon', f.signature); end if;
    end if;
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
