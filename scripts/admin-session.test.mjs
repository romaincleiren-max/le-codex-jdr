import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { observeAdminSession } from '../src/lib/adminSession.mjs';

function fixture(query) {
  let callback;
  let locked = false;
  const states = [];
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: cb => { callback = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from() {
      assert.equal(locked, false, 'database query must run after auth callback releases its lock');
      return { select: () => ({ eq: () => ({ maybeSingle: query }) }) };
    },
  };
  const stop = observeAdminSession(client, state => states.push(state));
  return { states, stop, emit(session) {
    locked = true;
    try { assert.equal(callback('SIGNED_IN', session), undefined); }
    finally { locked = false; }
  } };
}
const session = { user: { id: 'test', email: 'test@example.com' } };

test('admin lookup does not deadlock authentication', async () => {
  const f = fixture(async () => ({ data: { id: 'admin' }, error: null }));
  try {
    f.emit(session);
    await delay(20);
    assert.equal(f.states.at(-1).isAdmin, true);
  } finally { f.stop(); }
});

test('a late admin response cannot restore privileges after sign-out', async () => {
  let resolve;
  const f = fixture(() => new Promise(r => { resolve = r; }));
  try {
    f.emit(session);
    await delay(20);
    f.emit(null);
    resolve({ data: { id: 'admin' }, error: null });
    await delay(0);
    assert.equal(f.states.at(-1).user, null);
    assert.equal(f.states.at(-1).isAdmin, false);
  } finally { f.stop(); }
});

test('database errors fail closed and remain visible', async () => {
  const error = new Error('offline');
  const f = fixture(async () => ({ data: null, error }));
  try {
    f.emit(session);
    await delay(20);
    assert.equal(f.states.at(-1).isAdmin, false);
    assert.equal(f.states.at(-1).error, error);
  } finally { f.stop(); }
});
