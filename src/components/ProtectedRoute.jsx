import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { observeAdminSession } from '../lib/adminSession.mjs';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ user: null, isAdmin: false, loading: true, error: null });
  useEffect(() => observeAdminSession(supabase, setState), []);
  if (state.loading || state.error) return (
    <div className="min-h-screen bg-slate-900 flex flex-col gap-4 items-center justify-center text-white">
      <p role={state.error ? 'alert' : 'status'}>{state.error
        ? 'Impossible de vérifier votre accès administrateur. Le service de connexion est peut-être indisponible.'
        : 'Vérification de l’authentification…'}</p>
      {state.error && <button onClick={() => window.location.reload()}>Réessayer</button>}
    </div>
  );
  if (!state.user || !state.isAdmin) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};
