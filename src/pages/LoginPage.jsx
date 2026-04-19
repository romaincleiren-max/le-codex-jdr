import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loginRateLimiter } from '../utils/rateLimiter';
import RateLimiter from '../utils/rateLimiter';
import { useLanguage } from '../i18n';

const inputClass = "w-full px-4 py-3 border border-slate-700 bg-slate-800/80 text-amber-100 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder-slate-600 text-sm";
const labelClass = "flex items-center gap-2 text-amber-400/80 font-semibold mb-2 text-xs uppercase tracking-widest";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const reset = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async () => {
    const rateLimitCheck = loginRateLimiter.check();
    if (!rateLimitCheck.allowed) {
      setError(`Trop de tentatives. Réessayez dans ${RateLimiter.formatTime(rateLimitCheck.resetIn)}.`);
      return;
    }

    const attemptResult = loginRateLimiter.attempt();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const remaining = attemptResult.remaining;
      setError(`Identifiants incorrects.${remaining > 0 ? ` ${remaining} tentative(s) restante(s).` : ' Compte temporairement bloqué.'}`);
      setPassword('');
      return;
    }

    loginRateLimiter.reset();

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users').select('id').eq('email', data.user.email).single();

    const isAdmin = !adminError && !!adminCheck;
    const defaultDest = isAdmin ? '/admin' : '/player';
    const from = location.state?.from?.pathname || defaultDest;
    navigate(from, { replace: true });
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Cette adresse est déjà utilisée. Connectez-vous.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Tentative de connexion directe (si Supabase a "auto-confirm" activé)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginError && data.user) {
      navigate(location.state?.from?.pathname || '/player', { replace: true });
    } else {
      // Confirmation email requise
      setSuccess('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.');
      setEmail(''); setPassword(''); setConfirmPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (mode === 'login') await handleLogin();
      else await handleRegister();
    } catch (err) {
      console.error('Auth error:', err);
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0f0a06 50%, #1a1208 100%)' }}>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
                style={{ background: 'radial-gradient(circle, #d97706, #92400e)' }} />
              <div className="relative rounded-full p-6 border-2 border-amber-700/60"
                style={{ background: 'linear-gradient(135deg, #1c1209, #0f0a06)' }}>
                <span style={{ fontSize: 44, lineHeight: 1 }}>⚔️</span>
              </div>
            </div>
          </div>
          <h1 className="font-black text-amber-300 mb-1 tracking-wide"
            style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif', fontSize: '1.4rem' }}>
            Le Codex
          </h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase">Espace Aventurier</p>
        </div>

        {/* Toggle connexion / inscription */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-6"
          style={{ background: '#0d0a06' }}>
          {[
            { id: 'login',    label: 'Se connecter', icon: <LogIn size={14} /> },
            { id: 'register', label: 'S\'inscrire',   icon: <UserPlus size={14} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => reset(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all"
              style={mode === tab.id ? {
                background: 'linear-gradient(135deg, #92400e, #b45309)',
                color: '#fcd34d',
              } : {
                background: 'transparent',
                color: '#6b7280',
              }}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-slate-700/60 p-7 shadow-2xl"
          style={{ background: 'linear-gradient(160deg, #141008, #0d0a06)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={labelClass}><Mail size={13} /> Adresse email</label>
              <input type="email" value={email} required autoFocus
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className={inputClass} placeholder="vous@exemple.com" />
            </div>

            <div>
              <label className={labelClass}><Lock size={13} /> Mot de passe</label>
              <input type="password" value={password} required
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className={inputClass} placeholder="••••••••"
                minLength={mode === 'register' ? 6 : undefined} />
            </div>

            {mode === 'register' && (
              <div>
                <label className={labelClass}><Lock size={13} /> Confirmer le mot de passe</label>
                <input type="password" value={confirmPassword} required
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  className={inputClass} placeholder="••••••••" />
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-600/50 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-xl px-4 py-3">
                <p className="text-emerald-300 text-sm">{success}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full text-white py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
              style={{ background: isLoading ? '#78350f' : 'linear-gradient(135deg, #b45309, #d97706)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {mode === 'login' ? 'Connexion…' : 'Création du compte…'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === 'login' ? <><LogIn size={15} /> Entrer dans le Codex</> : <><UserPlus size={15} /> Créer mon compte</>}
                </span>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-slate-600 text-xs mt-5">
              Pas encore de compte ?{' '}
              <button onClick={() => reset('register')}
                className="text-amber-600 hover:text-amber-400 font-semibold transition-colors">
                S'inscrire gratuitement
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-center text-slate-600 text-xs mt-5">
              Déjà un compte ?{' '}
              <button onClick={() => reset('login')}
                className="text-amber-600 hover:text-amber-400 font-semibold transition-colors">
                Se connecter
              </button>
            </p>
          )}
        </div>

        <button onClick={() => navigate('/')}
          className="w-full mt-4 text-slate-600 hover:text-amber-500 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
          <ArrowLeft size={15} />
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
