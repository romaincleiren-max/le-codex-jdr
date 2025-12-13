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
    let mounted = true;
    
    // Timeout de sécurité : débloquer après 5 secondes max
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout vérification authentification - déblocage forcé');
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    // Vérifier la session au chargement
    const checkSession = async () => {
      try {
        console.log('🔍 Vérification session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur récupération session:', sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('✅ Utilisateur authentifié:', session.user.email);
          
          if (mounted) {
            setUser(session.user);
          }
          
          // Vérifier si l'utilisateur est admin
          try {
            const { data: adminCheck, error: adminError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle(); // maybeSingle au lieu de single pour éviter les erreurs si pas trouvé
            
            if (adminError) {
              console.error('❌ Erreur vérification admin:', adminError);
            }
            
            const userIsAdmin = !!adminCheck;
            console.log(userIsAdmin ? '✅ Utilisateur admin confirmé' : '⚠️ Utilisateur non admin');
            
            if (mounted) {
              setIsAdmin(userIsAdmin);
            }
          } catch (adminCheckError) {
            console.error('❌ Erreur critique vérification admin:', adminCheckError);
            if (mounted) {
              setIsAdmin(false);
            }
          }
        } else {
          console.log('ℹ️ Pas de session active');
          if (mounted) {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          setLoading(false);
          console.log('✅ Vérification terminée');
        }
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Changement d\'authentification:', _event);
      
      if (session?.user && mounted) {
        setUser(session.user);
        
        try {
          // Vérifier si l'utilisateur est admin
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
          
          setIsAdmin(!!adminCheck);
        } catch (error) {
          console.error('❌ Erreur vérification admin (onChange):', error);
          setIsAdmin(false);
        }
      } else if (mounted) {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
