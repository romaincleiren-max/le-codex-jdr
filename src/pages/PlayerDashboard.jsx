// ============================================================================
// PLAYER DASHBOARD — Tableau de bord du joueur connecté
// Supabase Realtime : déclenche LevelUpOverlay quand level_up_pending → true
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getMyCharacters } from '../services/charactersService';
import LevelUpOverlay from '../components/LevelUpOverlay';

const STATUS_LABEL = {
  pending:  { label: 'En attente', color: 'text-amber-400 border-amber-600 bg-amber-900/30' },
  approved: { label: 'Approuvé',   color: 'text-emerald-400 border-emerald-600 bg-emerald-900/30' },
  rejected: { label: 'Refusé',     color: 'text-red-400 border-red-600 bg-red-900/30' },
};

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);

  // Level-up overlay
  const [levelUpChar, setLevelUpChar] = useState(null); // { id, char_name, level }
  const prevPendingIds = useRef(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || '');
      setUserId(user?.id || null);
    });
    loadChars();
  }, []);

  // Supabase Realtime — écoute les changements sur les personnages du joueur
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`player-chars-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new;

        // Mettre à jour la liste locale
        setCharacters(prev =>
          prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
        );

        // Déclencher l'overlay si level_up_pending vient de passer à true
        if (updated.level_up_pending && !prevPendingIds.current.has(updated.id)) {
          prevPendingIds.current.add(updated.id);
          setLevelUpChar({
            id: updated.id,
            char_name: updated.char_name,
            level: (updated.level || 1) + 1,
          });
        }
        if (!updated.level_up_pending) {
          prevPendingIds.current.delete(updated.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Initialiser les IDs déjà en pending au chargement (pas d'overlay pour l'état initial)
  useEffect(() => {
    characters.forEach(c => {
      if (c.level_up_pending) prevPendingIds.current.add(c.id);
    });
  }, [loading]);

  const loadChars = async () => {
    setLoading(true);
    try {
      const data = await getMyCharacters();
      setCharacters(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleLevelUpDismiss = () => {
    const id = levelUpChar?.id;
    setLevelUpChar(null);
    if (id) navigate(`/character/${id}/levelup`);
  };

  return (
    <div className="min-h-screen px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>

      {/* Overlay level-up */}
      {levelUpChar && (
        <LevelUpOverlay
          charName={levelUpChar.char_name}
          newLevel={levelUpChar.level}
          onDismiss={handleLevelUpDismiss}
        />
      )}

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-amber-300 mb-1"
              style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>
              ✦ Mes Héros
            </h1>
            <p className="text-slate-500 text-sm">{userEmail}</p>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
            Déconnexion
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Liste des personnages */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Chargement...</div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚔️</div>
            <p className="text-slate-400 mb-6">Aucun personnage pour l'instant.</p>
            <button
              onClick={() => navigate('/forge')}
              className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold transition-all">
              ✦ Créer mon premier héros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {characters.map(char => {
              const statusMeta = STATUS_LABEL[char.status] || STATUS_LABEL.pending;
              return (
                <div key={char.id}
                  onClick={() => char.status === 'approved' && navigate(`/character/${char.id}`)}
                  className={`bg-slate-900/80 border rounded-2xl p-5 flex items-center gap-5 transition-all
                    ${char.level_up_pending
                      ? 'border-yellow-500 bg-yellow-900/10 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                      : char.status === 'approved'
                        ? 'border-slate-700 hover:border-amber-600 cursor-pointer hover:bg-slate-800/80'
                        : 'border-slate-700 opacity-70'
                    }`}>

                  {/* Portrait */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-600 flex items-center justify-center bg-slate-800">
                    {char.portrait_url
                      ? <img src={char.portrait_url} alt={char.char_name} className="w-full h-full object-cover" />
                      : <span className="text-3xl">{char.portrait_emoji || '⚔️'}</span>
                    }
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-bold text-amber-200 truncate"
                        style={{ fontFamily: 'Cinzel, serif' }}>
                        {char.char_name}
                      </h2>
                      {char.level_up_pending && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-300 animate-pulse">
                          ⬆ LEVEL UP !
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">
                      {char.race_name} · {char.class_name} · Niv. {char.level}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      <span>❤️ {char.current_hp}/{char.max_hp}</span>
                      <span>🛡 CA {char.ac}</span>
                    </div>
                  </div>

                  {/* Bouton level up ou statut */}
                  {char.level_up_pending ? (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/character/${char.id}/levelup`); }}
                      className="flex-shrink-0 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-xs transition-all">
                      ✦ Monter
                    </button>
                  ) : (
                    <div className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${statusMeta.color}`}>
                      {statusMeta.label}
                    </div>
                  )}

                  {char.status === 'approved' && !char.level_up_pending && (
                    <div className="flex-shrink-0 text-slate-600">→</div>
                  )}
                </div>
              );
            })}

            {/* Bouton créer un nouveau */}
            <button
              onClick={() => navigate('/forge')}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-600 text-slate-500 hover:text-amber-400 font-bold transition-all text-sm">
              + Créer un nouveau personnage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
