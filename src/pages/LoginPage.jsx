import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loginRateLimiter } from '../utils/rateLimiter';
import RateLimiter from '../utils/rateLimiter';
import { useLanguage } from '../i18n';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const rateLimitCheck = loginRateLimiter.check();
    if (!rateLimitCheck.allowed) {
      const timeRemaining = RateLimiter.formatTime(rateLimitCheck.resetIn);
      setError(`${t('login.tooManyAttempts')} ${timeRemaining}.`);
      setRateLimitInfo(rateLimitCheck);
      return;
    }

    setIsLoading(true);

    try {
      const attemptResult = loginRateLimiter.attempt();
      setRateLimitInfo(attemptResult);

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        const remaining = attemptResult.remaining;
        setError(
          `${t('login.invalidCredentials')} ${remaining > 0 ? `${remaining} ${t('login.attemptsRemaining')}` : t('login.limitReached')}`
        );
        setPassword('');
        setIsLoading(false);
        return;
      }

      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', data.user.email)
        .single();

      loginRateLimiter.reset();

      const isAdmin = !adminError && !!adminCheck;
      const defaultDest = isAdmin ? '/admin' : '/player';
      const from = location.state?.from?.pathname || defaultDest;
      navigate(from, { replace: true });

    } catch (err) {
      console.error('Auth error:', err);
      setError(t('login.connectionError'));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #080604 0%, #0f0a06 50%, #1a1208 100%)'
    }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">

          {/* Logo cadenas */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-amber-600 rounded-full p-8 shadow-2xl transform group-hover:scale-105 transition-transform">
                <Lock size={80} className="text-amber-400" strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="inline-block bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text mb-4">
            <h1 className="text-6xl font-bold">{t('login.title')}</h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-amber-600 to-amber-800 mx-auto rounded-full mb-6"></div>
          <p className="text-amber-300/70 text-xl">{t('login.subtitle')}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/40 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-amber-300 font-bold mb-2 text-sm uppercase tracking-wider">
                <Mail size={16} />
                {t('login.emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800/80 text-amber-100 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-slate-500"
                placeholder={t('login.emailPlaceholder')}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-amber-300 font-bold mb-2 text-sm uppercase tracking-wider">
                <Lock size={16} />
                {t('login.passwordLabel')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800/80 text-amber-100 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-slate-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600/60 rounded-xl p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white px-6 py-4 rounded-xl font-bold text-base shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: isLoading ? '#78350f' : 'linear-gradient(135deg, #b45309, #d97706)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t('login.loggingIn')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={16} />
                  {t('login.loginButton')}
                </span>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-slate-500 hover:text-amber-400 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm">
          <ArrowLeft size={16} />
          {t('login.backToHome')}
        </button>
      </div>
    </div>
  );
};
