import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminPassword = localStorage.getItem('le-codex-admin-password') || 'admin123';
    
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

        <div className="mt-6 bg-blue-50 border-2 border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Mot de passe par défaut :</strong> admin123
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Vous pouvez le changer dans Admin &gt; Paramètres après connexion
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
