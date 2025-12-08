import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, Shield } from 'lucide-react';
import { authenticateUser } from '../utils/authUtils';
import { loginRateLimiter } from '../utils/rateLimiter';
import RateLimiter from '../utils/rateLimiter';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
      
      // Utilise le système d'authentification sécurisé avec bcrypt
      const isAuthenticated = await authenticateUser(password);
      
      if (isAuthenticated) {
        // Réinitialiser le rate limiter en cas de succès
        loginRateLimiter.reset();
        
        // Redirige vers la page d'origine ou vers /admin par défaut
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        const remaining = attemptResult.remaining;
        setError(
          `Mot de passe incorrect. ${remaining > 0 ? `${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.` : 'Limite atteinte.'}`
        );
        setPassword('');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-amber-100 border-4 border-amber-900 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Lock size={64} className="mx-auto text-amber-800 mb-4" />
          <h1 className="text-3xl font-bold text-amber-900">Accès Admin</h1>
          <p className="text-amber-700 mt-2">Entrez le mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-900 font-bold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg focus:outline-none focus:border-amber-900"
              placeholder="Entrez le mot de passe..."
              autoFocus
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? '⏳ Connexion...' : '🔓 Se connecter'}
          </button>
        </form>

        <div className="mt-6 bg-amber-50 border-2 border-amber-700 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>🔐 Accès Sécurisé</strong>
          </p>
          <p className="text-xs text-amber-700 mt-2">
            Contactez l'administrateur pour obtenir le mot de passe
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold">
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
