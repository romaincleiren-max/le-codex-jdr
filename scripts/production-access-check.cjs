// Creates one isolated test player, checks actual production policies, then removes it.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
}));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
const player = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
let userId;
const results = [];
(async () => {
  try {
    const email = `codex-check-${crypto.randomUUID()}@example.invalid`;
    const password = crypto.randomBytes(32).toString('base64url');
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    const login = await player.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    results.push('Real player authentication: passed');
    for (const table of ['characters', 'purchases', 'admin_users']) {
      const r = await player.from(table).select('id').limit(1);
      assert.ok(r.error?.code === '42501' || (!r.error && r.data.length === 0), `${table}: unexpected access`);
      results.push(`${table}: no access to existing data`);
    }
    const catalog = await player.from('scenarios').select('id,pdf_files').eq('id', 10).single();
    assert.ok(!catalog.error && catalog.data.pdf_files.fr, 'French edition accessible');
    results.push('French catalogue edition: passed');
  } finally {
    await player.auth.signOut();
    if (userId) {
      const removed = await admin.auth.admin.deleteUser(userId);
      if (removed.error) throw new Error('Test player cleanup failed; inspect Auth users with codex-check prefix');
      results.push('Temporary player removed');
    }
    console.log(JSON.stringify(results, null, 2));
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
