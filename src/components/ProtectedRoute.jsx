import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, clearAuthSession, getSessionTimeRemaining, refreshSession } from '../utils/authUtils';

/**
 * Middleware de protection des routes
 * - Vérifie l'authentification avec expiration de session
 * - Redirige vers la page de connexion si non authentifié
 * - Rafraîchit automatiquement la session
 */
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Vérifie l'authentification au montage et lors des changements de route
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsChecking(false);

      if (authenticated) {
        // Rafraîchit la session pour prolonger l'expiration
        refreshSession();
      }
    };

    checkAuth();

    // Vérifie périodiquement l'expiration de la session (toutes les minutes)
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        setIsAuth(false);
        clearAuthSession();
      }
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, [location]);

  // Affiche un écran de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Vérification...</div>
      </div>
    );
  }

  // Redirige vers la page de connexion si non authentifié
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Affiche le composant enfant si authentifié
  return children;
};
