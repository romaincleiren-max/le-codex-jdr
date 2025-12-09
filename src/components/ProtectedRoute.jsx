import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Middleware de protection des routes avec Supabase Auth
 * - Vérifie l'authentification Supabase
 * - Vérifie que l'utilisateur est admin
 * - Redirige vers la page de connexion si non authentifié
 */
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Vérifier si l'utilisateur est admin
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          setIsAdmin(!!adminCheck);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erreur vérification session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        // Vérifier si l'utilisateur est admin
        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        setIsAdmin(!!adminCheck);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Affiche un écran de chargement pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Vérification de l'authentification...</div>
      </div>
    );
  }

  // Redirige vers la page de connexion si non authentifié ou pas admin
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Affiche le composant enfant si authentifié et admin
  return children;
};
