import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Utilise la variable d'environnement pour le mot de passe admin
    // Fallback sur localStorage pour permettre le changement de mot de passe
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const customPassword = localStorage.getItem('le-codex-admin-password');
    const adminPassword = customPassword || envPassword || 'admin123';
    
    if (password === adminPassword) {
      localStorage.setItem('le-codex-admin-auth', 'true');
      navigate('/admin');
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
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
            className="w-full bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-bold text-lg">
            🔓 Se connecter
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
