// ============================================================================
// INITIATIVE TRACKER — Le Codex
// Lit les persos depuis localStorage (forge_roster_v1) + PNJ custom
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';

// ── Constantes ──────────────────────────────────────────────────────────────

const CONDITIONS = [
  { id: 'blinded',       label: 'Aveuglé',     emoji: '👁️', color: '#7A4A8A' },
  { id: 'charmed',       label: 'Charmé',      emoji: '💕',  color: '#C060A0' },
  { id: 'frightened',    label: 'Effrayé',     emoji: '😨',  color: '#8A5A2A' },
  { id: 'paralyzed',     label: 'Paralysé',    emoji: '🔒',  color: '#8A2A2A' },
  { id: 'poisoned',      label: 'Empoisonné',  emoji: '☠️',  color: '#4A7A2A' },
  { id: 'stunned',       label: 'Étourdi',     emoji: '💫',  color: '#6A5A1A' },
  { id: 'unconscious',   label: 'Inconscient', emoji: '💤',  color: '#4A4A7A' },
  { id: 'restrained',    label: 'Entravé',     emoji: '⛓️', color: '#5A3A1A' },
  { id: 'concentration', label: 'Concentré',   emoji: '🔮',  color: '#2A5A8A' },
];

function d20() { return Math.floor(Math.random() * 20) + 1; }
function statMod(v) { return Math.floor(((v || 10) - 10) / 2); }

// Couleur d'avatar basée sur le nom
const AVATAR_COLORS = ['#1e3a5f','#3a1e5f','#1e5f3a','#5f3a1e','#5f1e3a','#1e4a4a','#4a3a1e','#3a4a1e'];
function nameToColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Lecture roster forge ─────────────────────────────────────────────────────

function readForgeRoster() {
  try {
    const raw = localStorage.getItem('forge_roster_v1');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function rosterCharToCombatant(r) {
  const clsName = r.cls?.n || '';
  const dexMod = statMod(r.stats?.dex ?? r.dex ?? 10);
  const hp = r.hp ?? r.maxHp ?? 10;
  return {
    id:            'forge_' + r.id,
    forgeId:       r.id,
    type:          'player',
    name:          r.name || '—',
    playerName:    r.playerName || '',
    className:     clsName,
    level:         r.level || 1,
    raceName:      r.race?.n || '',
    portraitUrl:   r.photo || null,
    currentHp:     r.currentHp ?? hp,
    maxHp:         hp,
    ac:            r.ac || 10,
    dexMod,
    initiative:    null,
    conditions:    [],
    notes:         '',
    sheetData:     r,
  };
}

// ── Carte combattant ─────────────────────────────────────────────────────────

function CombatantCard({ combatant, isActive, rank, onUpdate, onRemove, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [hpDelta, setHpDelta] = useState('');

  const pct = combatant.maxHp > 0 ? Math.max(0, combatant.currentHp / combatant.maxHp) : 1;
  const hpColor = pct > 0.5 ? '#2D7A2D' : pct > 0.25 ? '#9A7A10' : pct > 0 ? '#9A2A10' : '#4A1A1A';
  const isDead = combatant.currentHp <= 0 && combatant.maxHp > 0;

  const applyHp = (delta) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp || 999, combatant.currentHp + delta));
    onUpdate(combatant.id, { currentHp: newHp });
    setHpDelta('');
  };

  const rollInit = (e) => {
    e.stopPropagation();
    const dexMod = combatant.dexMod ?? statMod(combatant.sheetData?.stats?.dex ?? 10);
    const roll = d20() + dexMod;
    onUpdate(combatant.id, { initiative: roll });
  };

  const toggleCondition = (condId) => {
    const cur = combatant.conditions || [];
    const next = cur.includes(condId) ? cur.filter(c => c !== condId) : [...cur, condId];
    onUpdate(combatant.id, { conditions: next });
  };

  // Portrait avec avatar initial si pas de photo
  const avatarBg = nameToColor(combatant.name);
  const portraitContent = combatant.portraitUrl
    ? <img src={combatant.portraitUrl} alt={combatant.name} className="w-full h-full object-cover" />
    : combatant.type === 'custom'
      ? <div className="w-full h-full flex items-center justify-center text-xl"
          style={{ fontSize: 22 }}>{combatant.portraitEmoji || '👹'}</div>
      : <div className="w-full h-full flex items-center justify-center font-black"
          style={{ background: avatarBg, color: 'rgba(255,255,255,0.85)', fontFamily: 'Cinzel, serif', fontSize: 20 }}>
          {(combatant.name || '?')[0].toUpperCase()}
        </div>;

  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{
        borderColor: isActive ? '#C9A84C' : isDead ? '#4A1A1A' : '#374151',
        background: isActive
          ? 'rgba(201,168,76,0.06)'
          : isDead ? 'rgba(74,26,26,0.3)' : 'rgba(15,10,6,0.85)',
        opacity: isDead ? 0.6 : 1,
        boxShadow: isActive ? '0 0 20px rgba(201,168,76,0.15)' : 'none',
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Rang */}
        <div className="w-6 text-center text-xs font-bold flex-shrink-0"
          style={{ color: isActive ? '#C9A84C' : '#4B5563' }}>
          {isActive ? '▶' : rank}
        </div>

        {/* Portrait cliquable → lance l'initiative */}
        <div className="relative flex-shrink-0 cursor-pointer group" onClick={rollInit} title="Lancer l'initiative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 transition-all"
            style={{ borderColor: isActive ? '#C9A84C' : '#374151', background: '#1A1208' }}>
            {portraitContent}
          </div>
          {/* Overlay 🎲 au hover */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontSize: 18 }}>🎲</div>
          {/* Badge dé toujours visible */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: '#0F0A06', border: '1px solid #374151', fontSize: 9 }}>🎲</div>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100 truncate" style={{ fontFamily: 'Cinzel, serif' }}>
              {combatant.name}
            </span>
            {combatant.className && (
              <span className="text-xs text-slate-500">{combatant.className} {combatant.level ? `niv.${combatant.level}` : ''}</span>
            )}
          </div>

          {/* Barre HP + contrôles */}
          {combatant.maxHp > 0 && (
            <>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: hpColor }} />
                </div>
                <span className="text-xs font-mono" style={{ color: hpColor }}>
                  {combatant.currentHp}/{combatant.maxHp}
                </span>
              </div>
              {/* Contrôles HP — accessibles à tous */}
              <div className="flex items-center gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
                <input
                  type="number"
                  value={hpDelta}
                  onChange={e => setHpDelta(e.target.value)}
                  placeholder="PV"
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-slate-200 text-center focus:outline-none focus:border-red-600"
                  onKeyDown={e => { if (e.key === 'Enter') applyHp(-(parseInt(hpDelta) || 0)); }}
                />
                <button
                  onClick={() => applyHp(-(parseInt(hpDelta) || 0))}
                  className="px-2 py-0.5 rounded text-xs font-black border border-red-900/70 bg-red-900/30 hover:bg-red-800/60 text-red-400 transition-colors">
                  −
                </button>
                <button
                  onClick={() => applyHp(parseInt(hpDelta) || 0)}
                  className="px-2 py-0.5 rounded text-xs font-black border border-green-900/70 bg-green-900/30 hover:bg-green-800/60 text-green-400 transition-colors">
                  +
                </button>
              </div>
            </>
          )}

          {/* Conditions */}
          {(combatant.conditions || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {combatant.conditions.map(cid => {
                const c = CONDITIONS.find(x => x.id === cid);
                return c ? (
                  <span key={cid} className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '33', color: c.color }}>
                    {c.emoji} {c.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Droite : initiative + CA + actions */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">CA {combatant.ac}</span>
            <div className="text-center min-w-[2.5rem]">
              <div className="text-xs text-slate-500">Init</div>
              <div className="text-lg font-black" style={{ color: '#C9A84C', fontFamily: 'Cinzel Decorative, serif' }}>
                {combatant.initiative ?? '—'}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
                className="w-7 h-7 rounded-lg text-xs transition-all flex items-center justify-center"
                style={{ background: editing ? '#92400E' : '#1F2937', color: editing ? '#FDE68A' : '#9CA3AF' }}
                title="Options avancées">
                ✏️
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onRemove(combatant.id); }}
              className="w-7 h-7 rounded-lg text-xs text-slate-500 hover:text-red-400 flex items-center justify-center"
              style={{ background: '#1F2937' }}>
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Panneau admin : conditions + notes + init manuelle */}
      {editing && isAdmin && (
        <div className="border-t border-slate-700 p-3 space-y-3">
          {/* Initiative manuelle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Init. manuelle :</span>
            <input type="number" defaultValue={combatant.initiative ?? ''}
              placeholder="—"
              className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-amber-300 text-center focus:outline-none"
              onChange={e => onUpdate(combatant.id, { initiative: e.target.value !== '' ? parseInt(e.target.value) : null })} />
          </div>
          {/* Conditions */}
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map(cond => {
              const active = (combatant.conditions || []).includes(cond.id);
              return (
                <button key={cond.id} onClick={() => toggleCondition(cond.id)}
                  className="text-xs px-2 py-0.5 rounded border transition-all"
                  style={{
                    borderColor: active ? cond.color : '#374151',
                    color: active ? cond.color : '#6B7280',
                    background: active ? cond.color + '22' : 'transparent',
                  }}>
                  {cond.emoji} {cond.label}
                </button>
              );
            })}
          </div>
          {/* Note */}
          <input type="text" defaultValue={combatant.notes || ''} placeholder="Note libre..."
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            onBlur={e => onUpdate(combatant.id, { notes: e.target.value })} />
        </div>
      )}
    </div>
  );
}

// ── Modal sélection depuis la forge ──────────────────────────────────────────

function SelectCharModal({ onAdd, onClose, onGoForge }) {
  const [roster, setRoster] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => { setRoster(readForgeRoster()); }, []);

  const toggle = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const confirm = () => {
    roster.filter(r => selected.has(r.id)).forEach(r => onAdd(rosterCharToCombatant(r)));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
            Mes personnages
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {roster.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚔️</div>
              <p className="text-slate-400 text-sm mb-4">Aucun personnage sauvegardé dans la forge.</p>
              <button onClick={onGoForge}
                className="px-5 py-2.5 rounded-xl bg-violet-800 hover:bg-violet-700 border border-violet-600 text-violet-100 font-bold text-sm">
                ✦ Créer un personnage
              </button>
            </div>
          ) : (
            roster.map(r => {
              const isSelected = selected.has(r.id);
              const avatarBg = nameToColor(r.name || '');
              return (
                <button key={r.id} onClick={() => toggle(r.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: isSelected ? '#C9A84C' : '#374151',
                    background: isSelected ? 'rgba(201,168,76,0.08)' : 'rgba(15,10,6,0.6)',
                  }}>
                  {/* Portrait */}
                  <div className="w-12 h-12 rounded-full flex-shrink-0 border-2 overflow-hidden"
                    style={{ borderColor: isSelected ? '#C9A84C' : '#374151' }}>
                    {r.photo
                      ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center font-black text-xl"
                          style={{ background: avatarBg, color: 'rgba(255,255,255,0.85)', fontFamily: 'Cinzel, serif' }}>
                          {(r.name || '?')[0].toUpperCase()}
                        </div>
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-200" style={{ fontFamily: 'Cinzel, serif' }}>{r.name}</div>
                    <div className="text-xs text-slate-500">{r.cls?.n || '—'} · {r.race?.n || '—'} · Niv. {r.level || 1}</div>
                    <div className="text-xs text-slate-600 mt-0.5">❤️ {r.hp || '?'} PV · 🛡 CA {r.ac || '?'}</div>
                  </div>
                  <div className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSelected ? '#C9A84C' : '#374151', background: isSelected ? '#92400E' : 'transparent' }}>
                    {isSelected && <span className="text-amber-300 text-xs">✓</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {roster.length > 0 && (
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={onGoForge}
              className="px-4 py-2.5 rounded-xl border border-violet-600 text-violet-300 hover:bg-violet-900/30 text-sm font-bold">
              ✦ Forge
            </button>
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 text-sm">
              Annuler
            </button>
            <button onClick={confirm} disabled={selected.size === 0}
              className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-100 font-bold text-sm">
              Ajouter ({selected.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ajout PNJ custom ───────────────────────────────────────────────────

function AddCustomModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', emoji: '👹', hp: 20, ac: 12, initiative: '' });
  const h = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      conditions: [], notes: '',
      playerName: 'MJ', className: 'PNJ', level: null, raceName: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>+ PNJ / Monstre</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <div className="space-y-4">
          {/* Initiative — très proéminente, en premier */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(201,168,76,0.05)', border: '2px solid rgba(201,168,76,0.35)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ fontFamily: 'Cinzel, serif', color: '#8B6914', letterSpacing: '.2em' }}>
              🎲 Score d'initiative
            </div>
            <div className="text-xs italic mb-3" style={{ color: '#6B7280' }}>
              Lancez votre d20 et entrez le résultat (1–20)
            </div>
            <input
              type="number"
              min={1} max={20}
              value={form.initiative}
              onChange={e => h('initiative', e.target.value)}
              placeholder="—"
              autoFocus
              className="focus:outline-none focus:border-amber-400"
              style={{
                display: 'block',
                width: '100%',
                background: 'rgba(0,0,0,0.6)',
                border: '2px solid rgba(201,168,76,0.5)',
                borderRadius: 10,
                padding: '.4rem',
                fontSize: 48,
                fontFamily: 'Cinzel Decorative, serif',
                color: '#C9A84C',
                textAlign: 'center',
                outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>

          {/* Nom + emoji */}
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-xs text-slate-400 mb-1 block">Icône</label>
              <input type="text" value={form.emoji} onChange={e => h('emoji', e.target.value)} maxLength={2}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-2xl text-center focus:outline-none focus:border-amber-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Nom *</label>
              <input type="text" value={form.name} onChange={e => h('name', e.target.value)} placeholder="Gobelin, Boss..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          </div>

          {/* HP + CA */}
          <div className="grid grid-cols-2 gap-3">
            {[['hp','PV max'], ['ac','Classe d\'Armure (CA)']].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-slate-400 mb-1 block">{l}</label>
                <input type="number" value={form[k]} onChange={e => h(k, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
            <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-sm">
              Ajouter au combat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function InitiativePage({ isAdmin = false, onGoForge }) {
  const [combatants, setCombatants] = useState([]);
  const [round, setRound] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const allCombatants = [...combatants].sort((a, b) => (b.initiative ?? -99) - (a.initiative ?? -99));
  const aliveCount = allCombatants.filter(c => c.currentHp > 0 || c.maxHp === 0).length;

  const handleUpdate = useCallback((id, updates) => {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const handleRemove = useCallback((id) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
    setActiveIdx(0);
  }, []);

  const handleAdd = useCallback((data) => {
    setCombatants(prev => {
      if (prev.find(c => c.id === data.id)) return prev;
      return [...prev, data];
    });
  }, []);

  const rollAllInitiative = () => {
    setCombatants(prev => prev.map(c => {
      if (c.initiative !== null) return c;
      const dexMod = c.dexMod ?? statMod(c.sheetData?.stats?.dex ?? 10);
      return { ...c, initiative: d20() + dexMod };
    }));
    setActiveIdx(0);
  };

  const resetAll = () => {
    if (!confirm('Vider le tracker ? Les personnages restent dans la forge.')) return;
    setCombatants([]);
    setActiveIdx(0);
    setRound(1);
  };

  const nextTurn = () => {
    const alive = allCombatants.map((c, i) => ({ ...c, _i: i })).filter(c => c.currentHp > 0 || c.maxHp === 0);
    if (!alive.length) return;
    const cur = alive.findIndex(c => c._i === activeIdx);
    if (cur === alive.length - 1) { setActiveIdx(alive[0]._i); setRound(r => r + 1); }
    else setActiveIdx(alive[cur + 1]?._i ?? 0);
  };

  const prevTurn = () => {
    const alive = allCombatants.map((c, i) => ({ ...c, _i: i })).filter(c => c.currentHp > 0 || c.maxHp === 0);
    if (!alive.length) return;
    const cur = alive.findIndex(c => c._i === activeIdx);
    if (cur <= 0) { setActiveIdx(alive[alive.length - 1]._i); if (round > 1) setRound(r => r - 1); }
    else setActiveIdx(alive[cur - 1]._i);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>

      <div className="max-w-4xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-amber-300 mb-1"
            style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>⚔ Initiative</h1>
          <p className="text-slate-400 text-sm">Tracker de combat D&D 5e</p>
        </div>

        {/* Barre de contrôle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl border border-slate-700"
          style={{ background: 'rgba(15,10,6,0.9)' }}>

          {/* Round + navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prevTurn}
              className="w-9 h-9 rounded-lg border border-slate-600 text-slate-300 hover:border-amber-600 hover:text-amber-300 flex items-center justify-center text-lg">◀</button>
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Round</div>
              <div className="text-3xl font-black text-amber-400" style={{ fontFamily: 'Cinzel Decorative, serif' }}>{round}</div>
              <div className="text-xs text-slate-500">{aliveCount} actif{aliveCount > 1 ? 's' : ''}</div>
            </div>
            <button onClick={nextTurn}
              className="w-9 h-9 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-100 flex items-center justify-center text-lg font-bold">▶</button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowSelectModal(true)}
              className="px-3 py-2 rounded-xl bg-violet-800 hover:bg-violet-700 border border-violet-600 text-sm text-violet-100 font-bold transition-all">
              Mes persos
            </button>
            <button onClick={rollAllInitiative}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-amber-600 text-sm text-slate-300 hover:text-amber-300 transition-all">
              🎲 Initiative
            </button>
            {isAdmin && (
              <button onClick={() => setShowAddModal(true)}
                className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 border border-amber-600 text-sm text-amber-100 font-bold transition-all">
                + PNJ
              </button>
            )}
            <button onClick={resetAll}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm text-slate-400 hover:text-red-400 transition-all">
              Vider
            </button>
          </div>
        </div>

        {/* État vide */}
        {allCombatants.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl">
            <div className="text-5xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold text-slate-300 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
              Aucun combattant
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Ajoutez vos personnages depuis la Forge, ou créez un PNJ directement.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setShowSelectModal(true)}
                className="px-6 py-2.5 bg-violet-800 hover:bg-violet-700 text-violet-100 rounded-xl font-bold text-sm border border-violet-600">
                Sélectionner mes persos
              </button>
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
        {allCombatants.length > 0 && (
          <div className="space-y-2">
            {allCombatants.map((c, i) => (
              <div key={c.id} onClick={() => setActiveIdx(i)} className="cursor-pointer">
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
      </div>

      {/* Modals */}
      {showSelectModal && (
        <SelectCharModal
          onAdd={handleAdd}
          onClose={() => setShowSelectModal(false)}
          onGoForge={() => { setShowSelectModal(false); onGoForge?.(); }}
        />
      )}
      {showAddModal && (
        <AddCustomModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
