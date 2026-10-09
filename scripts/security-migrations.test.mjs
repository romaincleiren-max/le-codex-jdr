import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('migrations preserve PDFs and isolate catalogue, purchases, submissions and characters', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      grant usage on schema public, auth, storage to anon, authenticated;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role', true) $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email', true)) $$;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create table public.admin_users(id int, email text);
      create table public.campaigns(id int primary key, pdf_url text);
      create table public.scenarios(id int primary key, pdf_url text);
      insert into public.scenarios values (10,'scenarios/chapter-one.pdf'),(11,null);
      create table public.submissions(id int, email text, summary text, status text, admin_notes text);
      create table public.characters(id int primary key, user_id uuid, status text, is_in_session boolean default false, level_up_pending boolean default false, level_up_enabled boolean default false, level int default 1);
      create table storage.buckets(id text primary key, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id int, bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant all on storage.objects to anon, authenticated;
      create policy dangerous_legacy_storage on storage.objects for all using(true) with check(true);
      insert into storage.buckets values ('pdfs',true,null,null);
      insert into storage.objects values(1,'pdfs','scenarios/chapter-one.pdf');
    `);
    for (const table of ['purchases','orders','order_items','products','themes','site_settings','tags','scenario_tags','game_systems']) {
      await db.exec(`create table public.${table}(id int); grant all on public.${table} to anon,authenticated; alter table public.${table} enable row level security; create policy legacy_open on public.${table} for all using(true) with check(true);`);
    }
    const scripts = ['20261009_pdf_editions_security.sql','20261009_character_access.sql'].map(name => fs.readFileSync(`supabase/migrations/${name}`,'utf8'));
    for (let pass = 0; pass < 2; pass++) for (const sql of scripts) await db.exec(sql);
    assert.deepEqual((await db.query('select pdf_files from scenarios order by id')).rows, [{pdf_files:{fr:'scenarios/chapter-one.pdf'}},{pdf_files:{}}]);
    await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-000000000001','admin@example.test',now()),('00000000-0000-0000-0000-000000000002','player@example.test',now()); insert into admin_users values(1,'admin@example.test'); insert into purchases values(1); insert into characters values(1,'00000000-0000-0000-0000-000000000002','pending',false,false,false,1),(2,'00000000-0000-0000-0000-000000000003','approved',false,false,false,1);`);
    await db.exec(`set role anon; select set_config('request.jwt.claim.role','anon',false);`);
    await assert.rejects(db.query('select * from purchases'), /permission denied/);
    await assert.rejects(db.query("update scenarios set pdf_files='{}'"), /permission denied/);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await assert.rejects(db.query("insert into storage.objects values(2,'classes','bad.svg')"), /row-level security/);
    await assert.rejects(db.query("insert into storage.objects values(3,'pdfs','stolen.pdf')"), /row-level security/);
    await db.exec(`insert into submissions values(1,'user@example.test','An adventure','pending',null)`);
    await assert.rejects(db.query('select * from submissions'), /permission denied/);
    await assert.rejects(db.query("insert into submissions values(2,'x@y.test','x','approved',null)"), /row-level security/);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.role','authenticated',false),set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false),set_config('request.jwt.claim.email','player@example.test',false);`);
    assert.equal((await db.query('select * from purchases')).rows.length,0);
    assert.deepEqual((await db.query('select id from characters')).rows,[{id:1}]);
    await assert.rejects(db.query("update characters set status='approved' where id=1"), /administrator/);
    await assert.rejects(db.query('update characters set level=2 where id=1'), /not authorized/);
    await assert.rejects(db.query("insert into admin_users values(2,'player@example.test')"), /row-level security/);
    await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false),set_config('request.jwt.claim.email','admin@example.test',false);`);
    assert.equal((await db.query('select * from purchases')).rows.length,1);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await db.exec("update characters set status='approved',level_up_pending=true where id=1");
    await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false),set_config('request.jwt.claim.email','player@example.test',false); update characters set level=2 where id=1;`);
    assert.equal((await db.query('select level_up_pending from characters where id=1')).rows[0].level_up_pending,false);
  } finally { await db.close(); }
});
