-- Le Codex: execute once in the Supabase SQL editor, before deploying the app.
-- Transactional and repeatable. No content or purchase is deleted.
begin;

alter table public.campaigns add column if not exists pdf_files jsonb;
alter table public.scenarios add column if not exists pdf_files jsonb;
update public.campaigns set pdf_files = case when nullif(trim(pdf_url), '') is null then '{}'::jsonb else jsonb_build_object('fr', pdf_url) end where pdf_files is null;
update public.scenarios set pdf_files = case when nullif(trim(pdf_url), '') is null then '{}'::jsonb else jsonb_build_object('fr', pdf_url) end where pdf_files is null;
alter table public.campaigns alter column pdf_files set default '{}'::jsonb;
alter table public.scenarios alter column pdf_files set default '{}'::jsonb;
alter table public.campaigns alter column pdf_files set not null;
alter table public.scenarios alter column pdf_files set not null;
-- Strip old signed URL query tokens from public catalogue metadata.
update public.campaigns set pdf_url = regexp_replace(pdf_url, '\?.*$', '') where pdf_url like 'https://%';
update public.scenarios set pdf_url = regexp_replace(pdf_url, '\?.*$', '') where pdf_url like 'https://%';
update public.campaigns c set pdf_files = coalesce((select jsonb_object_agg(key, case when value like 'https://%' then regexp_replace(value, '\?.*$', '') else value end) from jsonb_each_text(c.pdf_files)), '{}'::jsonb);
update public.scenarios s set pdf_files = coalesce((select jsonb_object_agg(key, case when value like 'https://%' then regexp_replace(value, '\?.*$', '') else value end) from jsonb_each_text(s.pdf_files)), '{}'::jsonb);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'campaign_pdf_files_object') then
    alter table public.campaigns add constraint campaign_pdf_files_object check (jsonb_typeof(pdf_files) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'scenario_pdf_files_object') then
    alter table public.scenarios add constraint scenario_pdf_files_object check (jsonb_typeof(pdf_files) = 'object');
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
create or replace function private.codex_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.admin_users a on lower(a.email) = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.codex_admin() from public, anon;
grant execute on function private.codex_admin() to anon, authenticated;

-- Replace ALL permissive policies on sensitive tables, regardless of old names.
do $$ declare p record; t text; begin
  foreach t in array array['admin_users','purchases','orders','order_items','products','submissions','campaigns','scenarios','themes','site_settings','tags','scenario_tags','game_systems'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
      execute format('revoke all on public.%I from anon, authenticated', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
      execute format('create policy codex_admin_access on public.%I for all to authenticated using ((select private.codex_admin())) with check ((select private.codex_admin()))', t);
    end if;
  end loop;
end $$;
-- A player may check their own admin membership, never assign it.
create policy codex_own_admin_check on public.admin_users for select to authenticated
  using (lower(email) = lower(auth.jwt()->>'email'));
-- The public catalogue contains descriptions and edition paths, not signed URLs.
do $$ declare t text; begin
  foreach t in array array['campaigns','scenarios','themes','site_settings','tags','scenario_tags','game_systems'] loop
    execute format('grant select on public.%I to anon', t);
    execute format('create policy codex_public_catalog on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
-- Submission is the sole public write; visitors cannot read/edit other submissions.
grant insert on public.submissions to anon;
create policy codex_submit on public.submissions for insert to anon, authenticated
  with check (status = 'pending' and admin_notes is null and length(email) between 3 and 254 and length(summary) <= 20000);

-- Restrictive policies also neutralize legacy broad storage policies.
update storage.buckets set public = false, file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf'] where id = 'pdfs';
drop policy if exists codex_pdf_read_guard on storage.objects;
drop policy if exists codex_pdf_insert_guard on storage.objects;
drop policy if exists codex_pdf_update_guard on storage.objects;
drop policy if exists codex_pdf_delete_guard on storage.objects;
create policy codex_pdf_read_guard on storage.objects as restrictive for select to anon, authenticated
  using (bucket_id <> 'pdfs' or (auth.role() = 'authenticated' and (select private.codex_admin())));
create policy codex_pdf_insert_guard on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'pdfs' or (auth.role() = 'authenticated' and (select private.codex_admin())));
create policy codex_pdf_update_guard on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id <> 'pdfs' or (auth.role() = 'authenticated' and (select private.codex_admin())))
  with check (bucket_id <> 'pdfs' or (auth.role() = 'authenticated' and (select private.codex_admin())));
create policy codex_pdf_delete_guard on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id <> 'pdfs' or (auth.role() = 'authenticated' and (select private.codex_admin())));
drop policy if exists codex_pdf_admin on storage.objects;
create policy codex_pdf_admin on storage.objects for all to authenticated
  using (bucket_id = 'pdfs' and (select private.codex_admin()))
  with check (bucket_id = 'pdfs' and (select private.codex_admin()));

-- Public uploads are limited to submissions; all other asset changes need admin.
update storage.buckets set public = false, file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf'] where id = 'submissions';
drop policy if exists codex_asset_insert_guard on storage.objects;
drop policy if exists codex_asset_update_guard on storage.objects;
drop policy if exists codex_asset_delete_guard on storage.objects;
drop policy if exists codex_submission_read_guard on storage.objects;
create policy codex_asset_insert_guard on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id = 'submissions' or (select private.codex_admin()));
create policy codex_asset_update_guard on storage.objects as restrictive for update to anon, authenticated
  using ((select private.codex_admin())) with check ((select private.codex_admin()));
create policy codex_asset_delete_guard on storage.objects as restrictive for delete to anon, authenticated
  using ((select private.codex_admin()));
create policy codex_submission_read_guard on storage.objects as restrictive for select to anon, authenticated
  using (bucket_id <> 'submissions' or (select private.codex_admin()));

-- Prevent legacy sales views from exposing personal information via owner privileges.
do $$ declare v text; begin
  foreach v in array array['purchases_with_status','recent_downloads','sales_stats'] loop
    if to_regclass('public.' || v) is not null then
      execute format('revoke all on public.%I from anon, authenticated', v);
    end if;
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
