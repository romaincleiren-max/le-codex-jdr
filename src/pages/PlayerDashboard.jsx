// ============================================================================
// PLAYER DASHBOARD — Tableau de bord du joueur connecté
// Supabase Realtime : déclenche LevelUpOverlay quand level_up_pending → true
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getMyCharacters } from '../services/charactersService';
import LevelUpOverlay from '../components/LevelUpOverlay';

const STATUS_META = {
  pending:  {
    label: 'En attente',
    hint:  'En attente de validation par le Maître de Jeu',
    color: 'text-amber-400 border-amber-600/60 bg-amber-900/20',
  },
  approved: {
    label: 'Approuvé',
    hint:  'Cliquez pour voir la fiche',
    color: 'text-emerald-400 border-emerald-600/60 bg-emerald-900/20',
  },
  rejected: {
    label: 'Refusé',
    hint:  'Contactez votre MJ pour plus d\'informations',
    color: 'text-red-400 border-red-600/60 bg-red-900/20',
  },
};

function getDisplayName(email) {
  if (!email) return 'Aventurier';
  return email.split('@')[0];
}

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);

  const [levelUpChar, setLevelUpChar] = useState(null);
  const prevPendingIds = useRef(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || '');
      setUserId(user?.id || null);
    });
    loadChars();
  }, []);

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
        setCharacters(prev =>
          prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
        );
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
    <div className="min-h-screen px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>

      {levelUpChar && (
        <LevelUpOverlay
          charName={levelUpChar.char_name}
          newLevel={levelUpChar.level}
          onDismiss={handleLevelUpDismiss}
        />
      )}

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Retour + titre */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1.5">
              ← Accueil
            </button>
            <div className="w-px h-5 bg-slate-700" />
            <div>
              <h1 className="text-2xl font-black text-amber-300 leading-none"
                style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>
                Mes Héros
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">{getDisplayName(userEmail)}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
            Déconnexion
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600/60 rounded-xl p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500">Chargement...</div>

        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚔️</div>
            <p className="text-slate-400 mb-2 font-medium">Aucun personnage pour l'instant.</p>
            <p className="text-slate-600 text-sm mb-8">Créez votre héros dans la Forge pour commencer l'aventure.</p>
            <button
              onClick={() => navigate('/forge')}
              className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #b45309, #d97706)', color: '#fff' }}>
              ✦ Forger mon premier héros
            </button>
          </div>

        ) : (
          <div className="space-y-3">
            {characters.map(char => {
              const meta = STATUS_META[char.status] || STATUS_META.pending;
              const isClickable = char.status === 'approved';

              return (
                <div key={char.id}
                  onClick={() => isClickable && navigate(`/character/${char.id}`)}
                  title={!isClickable ? meta.hint : ''}
                  className={[
                    'bg-slate-900/80 border rounded-2xl p-4 flex items-center gap-4 transition-all',
                    char.level_up_pending
                      ? 'border-yellow-500/70 bg-yellow-900/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                      : isClickable
                        ? 'border-slate-700 hover:border-amber-600/60 cursor-pointer hover:bg-slate-800/80'
                        : 'border-slate-800 opacity-60',
                  ].join(' ')}>

                  {/* Portrait */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-800">
                    {char.portrait_url
                      ? <img src={char.portrait_url} alt={char.char_name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{char.portrait_emoji || '⚔️'}</span>
                    }
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h2 className="text-base font-bold text-amber-200 truncate"
                        style={{ fontFamily: 'Cinzel, serif' }}>
                        {char.char_name}
                      </h2>
                      {char.level_up_pending && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/60 text-yellow-300 animate-pulse flex-shrink-0">
                          ⬆ Niveau disponible
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">
                      {char.race_name} · {char.class_name} · Niv.&nbsp;{char.level}
                    </p>
                    {isClickable && (
                      <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                        <span>❤ {char.current_hp}/{char.max_hp} PV</span>
                        <span>🛡 CA {char.ac}</span>
                      </div>
                    )}
                    {!isClickable && !char.level_up_pending && (
                      <p className="text-xs text-slate-600 mt-1">{meta.hint}</p>
                    )}
                  </div>

                  {/* Action droite */}
                  {char.level_up_pending ? (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/character/${char.id}/levelup`); }}
                      className="flex-shrink-0 px-3 py-2 rounded-xl font-black text-xs transition-all hover:scale-[1.04]"
                      style={{ background: '#eab308', color: '#1c1917' }}>
                      ⬆ Monter de niveau
                    </button>
                  ) : (
                    <div className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </div>
                  )}

                  {isClickable && !char.level_up_pending && (
                    <span className="flex-shrink-0 text-slate-600 text-sm ml-1">›</span>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => navigate('/forge')}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-600/50 text-slate-500 hover:text-amber-400 font-medium transition-all text-sm">
              + Forger un nouveau personnage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
