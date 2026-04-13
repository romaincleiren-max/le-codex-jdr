// ============================================================================
// INITIATIVE TRACKER — Le Codex
// Tracker de combat D&D 5e avec photos, HP, conditions, temps réel
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  getSessionCharacters,
  updateCombatStats,
  subscribeToSessionChanges,
} from '../services/charactersService';

// ── Constantes ──────────────────────────────────────────────────────────────

const CONDITIONS = [
  { id: 'blinded',    label: 'Aveuglé',    emoji: '👁️‍🗨️', color: '#7A4A8A' },
  { id: 'charmed',    label: 'Charmé',     emoji: '💕',    color: '#C060A0' },
  { id: 'frightened', label: 'Effrayé',    emoji: '😨',    color: '#8A5A2A' },
  { id: 'paralyzed',  label: 'Paralysé',   emoji: '🔒',    color: '#8A2A2A' },
  { id: 'poisoned',   label: 'Empoisonné', emoji: '☠️',    color: '#4A7A2A' },
  { id: 'stunned',    label: 'Étourdi',    emoji: '💫',    color: '#6A5A1A' },
  { id: 'unconscious',label: 'Inconscient',emoji: '💤',    color: '#4A4A7A' },
  { id: 'restrained', label: 'Entravé',    emoji: '⛓️',    color: '#5A3A1A' },
  { id: 'concentration',label:'Concentré', emoji: '🔮',    color: '#2A5A8A' },
];

const CLASS_EMOJI = {
  barbarian:'⚔️', bard:'🎵', cleric:'✝️', druid:'🌿', fighter:'🛡️',
  monk:'👊', paladin:'⚜️', ranger:'🏹', rogue:'🗡️', sorcerer:'✨',
  warlock:'👁️', wizard:'📚',
};

function d20() { return Math.floor(Math.random() * 20) + 1; }
function mod(stat) { return Math.floor((stat - 10) / 2); }

// ── Carte combattant ─────────────────────────────────────────────────────────

function CombatantCard({ combatant, isActive, rank, onUpdate, onRemove, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [hpDelta, setHpDelta] = useState('');

  const pct = combatant.maxHp > 0 ? Math.max(0, combatant.currentHp / combatant.maxHp) : 1;
  const hpColor = pct > 0.5 ? '#2D7A2D' : pct > 0.25 ? '#9A7A10' : pct > 0 ? '#9A2A10' : '#C0392B';
  const isDead = combatant.currentHp <= 0 && combatant.maxHp > 0;
  const isCustom = combatant.type === 'custom';

  const applyHpChange = (delta) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp || 999, combatant.currentHp + delta));
    onUpdate(combatant.id, { current_hp: newHp, currentHp: newHp });
    setHpDelta('');
  };

  const toggleCondition = (condId) => {
    const cur = combatant.conditions || [];
    const next = cur.includes(condId) ? cur.filter(c => c !== condId) : [...cur, condId];
    onUpdate(combatant.id, { conditions: next });
  };

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        isActive
          ? 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
          : isDead
          ? 'border-slate-700 opacity-50'
          : 'border-slate-700 hover:border-slate-500'
      }`}
      style={{ background: isActive ? 'rgba(251,191,36,0.06)' : 'rgba(15,23,42,0.8)' }}
    >
      {/* Barre initiative (gauche) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${isCustom ? 'bg-red-700' : 'bg-amber-500'}`} />

      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start gap-3">
          {/* Rang */}
          <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0 w-10">
            {isActive && <div className="text-amber-400 text-sm">▶</div>}
            <div className="text-2xl font-black text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
              {rank}
            </div>
            <div className="text-xs text-slate-500">init.</div>
            <div className="text-base font-bold text-slate-200">{combatant.initiative ?? '—'}</div>
          </div>

          {/* Portrait */}
          <div className="flex-shrink-0">
            {combatant.portraitUrl ? (
              <div className="relative">
                <img
                  src={combatant.portraitUrl}
                  alt={combatant.name}
                  className={`w-16 h-16 rounded-xl object-cover border-2 ${
                    isActive ? 'border-amber-400' : 'border-slate-600'
                  }`}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {isDead && (
                  <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center text-2xl">💀</div>
                )}
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl ${
                isActive ? 'border-amber-400 bg-amber-900/30' : 'border-slate-600 bg-slate-800'
              }`}>
                {isDead ? '💀' : (combatant.emoji || combatant.portraitEmoji || '⚔️')}
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-bold text-base leading-tight ${isActive ? 'text-amber-300' : 'text-slate-100'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                  {combatant.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {combatant.playerName && <span className="text-amber-500/70">{combatant.playerName} · </span>}
                  {combatant.className}{combatant.level ? ` Niv.${combatant.level}` : ''}{combatant.raceName ? ` · ${combatant.raceName}` : ''}
                  {combatant.ac ? <span className="ml-2 text-slate-400">🛡 CA {combatant.ac}</span> : ''}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-slate-500 hover:text-amber-400 text-xs flex-shrink-0 mt-0.5"
                >
                  {editing ? '✕' : '✎'}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => onRemove(combatant.id)}
                  className="text-slate-600 hover:text-red-400 text-xs flex-shrink-0"
                >
                  🗑
                </button>
              )}
            </div>

            {/* Barre HP */}
            {combatant.maxHp > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>PV {combatant.currentHp}/{combatant.maxHp}</span>
                  <span style={{ color: hpColor }}>
                    {isDead ? '💀 À terre' : pct > 0.75 ? 'En forme' : pct > 0.5 ? 'Blessé' : pct > 0.25 ? 'Sévère' : 'Critique'}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, background: hpColor }}
                  />
                </div>
              </div>
            )}

            {/* Conditions */}
            {(combatant.conditions || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(combatant.conditions || []).map(condId => {
                  const cond = CONDITIONS.find(c => c.id === condId);
                  if (!cond) return null;
                  return (
                    <span
                      key={condId}
                      onClick={isAdmin ? () => toggleCondition(condId) : undefined}
                      className="text-xs px-2 py-0.5 rounded border cursor-pointer transition-opacity hover:opacity-70"
                      style={{ borderColor: cond.color, color: cond.color, background: cond.color + '22' }}
                    >
                      {cond.emoji} {cond.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Panneau édition admin */}
            {editing && isAdmin && (
              <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                {/* Contrôles HP */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-8">PV</span>
                  <input
                    type="number"
                    value={hpDelta}
                    onChange={e => setHpDelta(e.target.value)}
                    placeholder="±0"
                    className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    onKeyDown={e => { if (e.key === 'Enter') applyHpChange(parseInt(hpDelta) || 0); }}
                  />
                  <button onClick={() => applyHpChange(-(Math.abs(parseInt(hpDelta) || 0)))}
                    className="px-2 py-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 rounded text-xs border border-red-800">
                    ─ Dmg
                  </button>
                  <button onClick={() => applyHpChange(Math.abs(parseInt(hpDelta) || 0))}
                    className="px-2 py-1 bg-green-900/50 hover:bg-green-800/70 text-green-300 rounded text-xs border border-green-800">
                    + Soin
                  </button>
                </div>
                {/* Conditions */}
                <div className="flex flex-wrap gap-1">
                  {CONDITIONS.map(cond => {
                    const active = (combatant.conditions || []).includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        onClick={() => toggleCondition(cond.id)}
                        className="text-xs px-2 py-0.5 rounded border transition-all"
                        style={{
                          borderColor: active ? cond.color : '#374151',
                          color: active ? cond.color : '#6B7280',
                          background: active ? cond.color + '22' : 'transparent',
                        }}
                      >
                        {cond.emoji} {cond.label}
                      </button>
                    );
                  })}
                </div>
                {/* Note */}
                <input
                  type="text"
                  defaultValue={combatant.notes || ''}
                  placeholder="Note libre..."
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  onBlur={e => onUpdate(combatant.id, { notes: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal ajout combattant custom ────────────────────────────────────────────

function AddCustomModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '', emoji: '👹', hp: 20, ac: 12, initiative: '',
    notes: '',
  });

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    onAdd({
      id: 'custom_' + Date.now(),
      type: 'custom',
      name: form.name.trim(),
      emoji: form.emoji,
      portraitEmoji: form.emoji,
      portraitUrl: null,
      currentHp: parseInt(form.hp) || 20,
      maxHp: parseInt(form.hp) || 20,
      ac: parseInt(form.ac) || 12,
      initiative: form.initiative !== '' ? parseInt(form.initiative) : null,
      conditions: [],
      notes: form.notes,
      playerName: 'MJ',
      className: 'PNJ', level: null, raceName: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
            + Ajouter un combattant
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-xs text-slate-400 mb-1 block">Emoji</label>
              <input
                type="text"
                value={form.emoji}
                onChange={e => handle('emoji', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-2xl text-center focus:outline-none focus:border-amber-500"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handle('name', e.target.value)}
                placeholder="Gobelin, Boss, ..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">PV max</label>
              <input type="number" value={form.hp} onChange={e => handle('hp', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">CA</label>
              <input type="number" value={form.ac} onChange={e => handle('ac', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Initiative</label>
              <input type="number" value={form.initiative} onChange={e => handle('initiative', e.target.value)}
                placeholder="auto"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Note</label>
            <input type="text" value={form.notes} onChange={e => handle('notes', e.target.value)}
              placeholder="Résistances, pouvoirs..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 text-sm">
              Annuler
            </button>
            <button onClick={submit}
              className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-sm">
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function InitiativePage({ isAdmin = false, onCreateChar }) {
  const [combatants, setCombatants] = useState([]);
  const [customCombatants, setCustomCombatants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les personnages en session depuis Supabase
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const chars = await getSessionCharacters();
      setCombatants(prev => chars.map(c => {
        // Préserver les valeurs locales non sauvegardées si existantes
        const existing = prev.find(p => p.id === c.id);
        return {
          id: c.id,
          type: 'player',
          name: c.char_name,
          playerName: c.player_name,
          className: c.class_name,
          level: c.level,
          raceName: c.race_name,
          portraitUrl: c.portrait_url,
          portraitEmoji: c.portrait_emoji || '⚔️',
          emoji: c.portrait_emoji || '⚔️',
          currentHp: existing?.currentHp ?? c.current_hp ?? c.max_hp,
          maxHp: c.max_hp || 0,
          ac: c.ac || 10,
          initiative: existing?.initiative ?? c.initiative_roll ?? null,
          conditions: existing?.conditions ?? (c.conditions || []),
          notes: existing?.notes ?? (c.notes || ''),
          sheetData: c.sheet_data || {},
        };
      }));
    } catch (e) {
      setError('Impossible de charger la session : ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    // Abonnement temps réel Supabase
    const sub = subscribeToSessionChanges(() => {
      loadSession();
    });
    return () => sub?.unsubscribe();
  }, [loadSession]);

  // Tous les combattants triés par initiative
  const allCombatants = [...combatants, ...customCombatants].sort((a, b) => {
    const ia = a.initiative ?? -1;
    const ib = b.initiative ?? -1;
    return ib - ia;
  });

  // Combattants vivants pour le tour
  const aliveCount = allCombatants.filter(c => c.currentHp > 0 || c.maxHp === 0).length;

  // Mise à jour locale + Supabase si c'est un joueur
  const handleUpdate = useCallback(async (id, updates) => {
    // Mettre à jour localement immédiatement
    if (id.startsWith('custom_')) {
      setCustomCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } else {
      setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      // Sauvegarder en Supabase (sans bloquer l'UI)
      setSyncing(true);
      try {
        await updateCombatStats(id, updates);
      } catch (e) {
        console.warn('Sync Supabase échoué :', e.message);
      } finally {
        setSyncing(false);
      }
    }
  }, []);

  const handleRemove = useCallback((id) => {
    if (id.startsWith('custom_')) {
      setCustomCombatants(prev => prev.filter(c => c.id !== id));
    } else {
      setCombatants(prev => prev.filter(c => c.id !== id));
    }
    setActiveIdx(0);
  }, []);

  const handleAddCustom = useCallback((data) => {
    setCustomCombatants(prev => [...prev, data]);
  }, []);

  // Lancer l'initiative pour tous (sans initiative)
  const rollAllInitiative = () => {
    const roll = (c) => {
      if (c.initiative !== null) return c;
      const dexMod = c.sheetData?.stats?.dex ? mod(c.sheetData.stats.dex) : 0;
      return { ...c, initiative: d20() + dexMod };
    };
    setCombatants(prev => prev.map(roll));
    setCustomCombatants(prev => prev.map(roll));
    setActiveIdx(0);
  };

  const resetInitiative = () => {
    if (!confirm('Réinitialiser toute l\'initiative ?')) return;
    setCombatants(prev => prev.map(c => ({ ...c, initiative: null })));
    setCustomCombatants(prev => prev.map(c => ({ ...c, initiative: null })));
    setActiveIdx(0);
    setRound(1);
  };

  const nextTurn = () => {
    const alive = allCombatants.map((c, i) => ({ ...c, _i: i })).filter(c => c.currentHp > 0 || c.maxHp === 0);
    if (!alive.length) return;
    const curAliveIdx = alive.findIndex(c => c._i === activeIdx);
    if (curAliveIdx === alive.length - 1) {
      setActiveIdx(alive[0]._i);
      setRound(r => r + 1);
    } else {
      setActiveIdx(alive[curAliveIdx + 1]?._i ?? 0);
    }
  };

  const prevTurn = () => {
    const alive = allCombatants.map((c, i) => ({ ...c, _i: i })).filter(c => c.currentHp > 0 || c.maxHp === 0);
    if (!alive.length) return;
    const curAliveIdx = alive.findIndex(c => c._i === activeIdx);
    if (curAliveIdx <= 0) {
      setActiveIdx(alive[alive.length - 1]._i);
      if (round > 1) setRound(r => r - 1);
    } else {
      setActiveIdx(alive[curAliveIdx - 1]._i);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>

      {/* En-tête */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-amber-300 mb-1"
            style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>
            ⚔ Initiative
          </h1>
          <p className="text-slate-400 text-sm">Tracker de combat — Supabase en temps réel</p>
          {syncing && <p className="text-xs text-amber-600 mt-1">🔄 Synchronisation…</p>}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        {/* Barre de contrôle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl border border-slate-700"
          style={{ background: 'rgba(15,10,6,0.9)' }}>

          {/* Round + navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prevTurn}
              className="w-9 h-9 rounded-lg border border-slate-600 text-slate-300 hover:border-amber-600 hover:text-amber-300 flex items-center justify-center text-lg">
              ◀
            </button>
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Round</div>
              <div className="text-3xl font-black text-amber-400" style={{ fontFamily: 'Cinzel Decorative, serif' }}>{round}</div>
              <div className="text-xs text-slate-500">{aliveCount} actif{aliveCount > 1 ? 's' : ''}</div>
            </div>
            <button onClick={nextTurn}
              className="w-9 h-9 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-100 flex items-center justify-center text-lg font-bold">
              ▶
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={rollAllInitiative}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-amber-600 text-sm text-slate-300 hover:text-amber-300 transition-all">
              🎲 Lancer initiative
            </button>
            <button onClick={resetInitiative}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm text-slate-400 hover:text-slate-200 transition-all">
              ↺ Reset
            </button>
            <button onClick={loadSession}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm text-slate-400 hover:text-slate-200 transition-all">
              🔄 Actualiser
            </button>
            {onCreateChar && (
              <button onClick={onCreateChar}
                className="px-3 py-2 rounded-xl bg-violet-800 hover:bg-violet-700 border border-violet-600 text-sm text-violet-100 font-bold transition-all">
                ✦ Créer mon perso
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowAddModal(true)}
                className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 border border-amber-600 text-sm text-amber-100 font-bold transition-all">
                + PNJ
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">⚔</div>
            <p className="text-slate-400">Chargement de la session…</p>
          </div>
        )}

        {/* Liste vide */}
        {!loading && allCombatants.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl">
            <div className="text-5xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold text-slate-300 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
              Aucun combattant en session
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
              {isAdmin
                ? 'Approuvez des personnages et activez-les dans la session via l\'onglet Admin → Personnages.'
                : 'La session de combat n\'a pas encore démarré. Attendez que le MJ la lance.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {onCreateChar && (
                <button onClick={onCreateChar}
                  className="px-6 py-2.5 bg-violet-800 hover:bg-violet-700 text-violet-100 rounded-xl font-bold text-sm border border-violet-600">
                  ✦ Créer mon personnage
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded-xl font-bold text-sm">
                  + Ajouter un PNJ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste des combattants */}
        {!loading && allCombatants.length > 0 && (
          <div className="space-y-3">
            {allCombatants.map((c, i) => (
              <div
                key={c.id}
                onClick={() => setActiveIdx(i)}
                className="cursor-pointer"
              >
                <CombatantCard
                  combatant={c}
                  isActive={activeIdx === i}
                  rank={i + 1}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        )}

        {/* Légende */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>Joueur
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-700"></span>PNJ/Monstre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#C0392B' }}></span>Hors combat
          </span>
        </div>
      </div>

      {/* Modal ajout custom */}
      {showAddModal && (
        <AddCustomModal
          onAdd={handleAddCustom}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
