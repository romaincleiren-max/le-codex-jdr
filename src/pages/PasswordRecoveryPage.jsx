import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PasswordRecoveryPage({ update = false }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState(''); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      if (update) {
        if (password.length < 12 || password !== confirmation) throw new Error('Utilisez au moins 12 caractères et deux mots de passe identiques.');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Ce lien a expiré. Demandez un nouveau lien de récupération.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error('Modification impossible. Demandez un nouveau lien ou réessayez.');
        setPassword(''); setConfirmation(''); setMessage('Mot de passe mis à jour. Vous pouvez vous connecter.');
        await supabase.auth.signOut();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw new Error('Envoi temporairement indisponible. Réessayez dans quelques minutes.');
        setMessage('Si cette adresse correspond à un compte, un lien de récupération vous sera envoyé. Vérifiez aussi les courriers indésirables.');
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-slate-900 text-amber-100 px-4 py-16">
    <form onSubmit={submit} className="max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold">{update ? 'Choisir un nouveau mot de passe' : 'Mot de passe oublié'}</h1>
      {update ? <>
        <label className="block">Nouveau mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>
        <label className="block">Confirmer le mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>
      </> : <label className="block">Adresse e-mail<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full p-3 rounded bg-slate-800" /></label>}
      <button disabled={busy} className="px-4 py-3 rounded bg-amber-700 disabled:opacity-50">{busy ? 'Veuillez patienter…' : update ? 'Enregistrer' : 'Recevoir le lien'}</button>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Link to="/login" className="block underline">Retour à la connexion</Link>
      {update && <Link to="/forgot-password" className="block underline">Demander un nouveau lien</Link>}
    </form>
  </main>;
}
