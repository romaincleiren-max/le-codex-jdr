// Auth callbacks must return before querying Supabase (auth-js holds a lock).
export function observeAdminSession(client, onState) {
  let disposed = false;
  let revision = 0;
  let timer;
  let timeout;
  timeout = setTimeout(() => {
    if (disposed) return;
    revision++;
    onState({ user: null, isAdmin: false, loading: false, error: new Error('Session indisponible. Réessayez.') });
  }, 15000);
  const schedule = (session) => {
    const current = ++revision;
    clearTimeout(timer);
    clearTimeout(timeout);
    const user = session?.user ?? null;
    onState({ user, isAdmin: false, loading: Boolean(user), error: null });
    if (!user) return;
    const finish = (isAdmin, error = null) => {
      if (disposed || current !== revision) return;
      clearTimeout(timeout);
      onState({ user, isAdmin, loading: false, error });
    };
    timeout = setTimeout(() => {
      finish(false, new Error('La vérification administrateur prend trop de temps. Rechargez la page pour réessayer.'));
      revision++;
    }, 15000);
    timer = setTimeout(async () => {
      try {
        const { data, error } = await client.from('admin_users').select('id').eq('email', user.email).maybeSingle();
        finish(!error && Boolean(data), error);
      } catch (error) { finish(false, error); }
    }, 0);
  };
  // Subscribe first; ignore an older getSession result if an event arrived.
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    if (!disposed) schedule(session);
  });
  const initialRevision = revision;
  client.auth.getSession().then(({ data, error }) => {
    if (disposed || revision !== initialRevision) return;
    if (error) throw error;
    schedule(data.session);
  }).catch(error => {
    if (!disposed && revision === initialRevision) {
      clearTimeout(timeout);
      onState({ user: null, isAdmin: false, loading: false, error });
    }
  });
  return () => {
    disposed = true;
    clearTimeout(timer);
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}
