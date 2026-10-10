import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { supabase } from '../lib/supabase';

export default function PasswordRecoveryPage({ update = false }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState(''); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      if (update) {
        if (password.length < 12 || password !== confirmation) throw new Error(t('recovery.rules'));
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error(t('recovery.expired'));
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(t('recovery.failed'));
        setPassword(''); setConfirmation(''); setMessage(t('recovery.updated'));
        await supabase.auth.signOut();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw new Error(t('recovery.unavailable'));
        setMessage(t('recovery.sent'));
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-slate-900 text-amber-100 px-4 py-16">
    <form onSubmit={submit} className="max-w-md mx-auto space-y-5">
      <LanguageSelector />
      <h1 className="text-2xl font-bold">{update ? t('recovery.newTitle') : t('recovery.title')}</h1>
      {update ? <>
        <label className="block">{t('recovery.newPassword')}<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>
        <label className="block">{t('account.confirm')}<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>
      </> : <label className="block">{t('account.email')}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>}
      <button disabled={busy} className="px-4 py-3 rounded bg-amber-700 disabled:opacity-50">{busy ? t('recovery.wait') : update ? t('recovery.save') : t('recovery.send')}</button>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Link to="/login" className="block underline">{t('recovery.back')}</Link>
      {update && <Link to="/forgot-password" className="block underline">{t('recovery.again')}</Link>}
    </form>
  </main>;
}
