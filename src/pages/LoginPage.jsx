import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loginRateLimiter } from '../utils/rateLimiter';
import RateLimiter from '../utils/rateLimiter';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('🔐 Tentative de connexion avec:', { email, passwordLength: password.length });
    
    // Vérifier le rate limiting AVANT la tentative
    const rateLimitCheck = loginRateLimiter.check();
    
    if (!rateLimitCheck.allowed) {
      const timeRemaining = RateLimiter.formatTime(rateLimitCheck.resetIn);
      setError(`Trop de tentatives de connexion. Veuillez réessayer dans ${timeRemaining}.`);
      setRateLimitInfo(rateLimitCheck);
      return;
    }
    
    setIsLoading(true);

    try {
      // Enregistrer la tentative
      const attemptResult = loginRateLimiter.attempt();
      setRateLimitInfo(attemptResult);
      
      console.log('📡 Envoi de la requête à Supabase...');
      
      // Authentification avec Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      console.log('📨 Réponse Supabase:', { data, error: authError });
      
      if (authError) {
        console.error('❌ Erreur d\'authentification:', authError);
        const remaining = attemptResult.remaining;
        setError(
          `Email ou mot de passe incorrect. ${remaining > 0 ? `${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.` : 'Limite atteinte.'}`
        );
        setPassword('');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Authentification réussie, vérification du statut admin...');
      
      // Vérifier si l'utilisateur est admin
      console.log('🔍 Vérification dans admin_users pour:', data.user.email);
      
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', data.user.email)
        .single();
      
      console.log('👤 Résultat admin_users:', { adminCheck, adminError });
      
      if (adminError || !adminCheck) {
        // Pas un admin, déconnecter
        console.warn('⚠️ Utilisateur non admin, déconnexion...');
        await supabase.auth.signOut();
        setError('Accès non autorisé. Cet utilisateur n\'est pas administrateur.');
        setPassword('');
        setIsLoading(false);
        return;
      }
      
      console.log('🎉 Utilisateur admin confirmé ! Redirection...');
      
      // Succès : réinitialiser le rate limiter et rediriger
      loginRateLimiter.reset();
      
      // Redirige vers la page d'origine ou vers /admin par défaut
      const from = location.state?.from?.pathname || '/admin';
      console.log('🚀 Navigation vers:', from);
      
      try {
        navigate(from, { replace: true });
        console.log('✅ Navigation appelée avec succès');
      } catch (navError) {
        console.error('❌ Erreur de navigation:', navError);
      }
      
    } catch (err) {
      console.error('Erreur d\'authentification:', err);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          {/* Logo cadenas */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-red-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-amber-500 rounded-full p-8 shadow-2xl transform group-hover:scale-105 transition-transform">
                <Lock size={80} className="text-amber-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="inline-block bg-gradient-to-r from-red-500 to-amber-600 text-transparent bg-clip-text mb-4">
            <h1 className="text-6xl font-bold">🔐 Connexion Admin</h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-amber-600 mx-auto rounded-full mb-6"></div>
          <p className="text-amber-300 text-xl">Accès réservé aux administrateurs</p>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-amber-300 font-bold mb-2 text-lg">
                <Mail size={20} />
                Email administrateur
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                placeholder="admin@exemple.com"
                autoFocus
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-amber-300 font-bold mb-2 text-lg">
                <Lock size={20} />
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-4">
                <p className="text-red-300 text-sm font-semibold">❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Connexion en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={20} />
                  Se connecter
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 font-semibold mb-2">
              🔐 Authentification sécurisée
            </p>
            <p className="text-xs text-blue-400">
              Cette page est protégée par Supabase Auth. Seuls les administrateurs autorisés dans la base de données peuvent accéder au panneau d'administration.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-amber-300 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
            <ArrowLeft size={20} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};
