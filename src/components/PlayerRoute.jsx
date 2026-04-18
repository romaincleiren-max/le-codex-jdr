// Guard de route pour les joueurs connectés (non-admin inclus)
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const PlayerRoute = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 5000);

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setUser(session?.user ?? null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-amber-300 text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
