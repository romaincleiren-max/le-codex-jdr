// ============================================================================
// LEVEL UP WIZARD — Style Baldur's Gate 3
// 4 étapes : Annonce → Dés de vie → ASI → Confirmation
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { updateCharacter, revokeLevelUp } from '../services/charactersService';

// ── Data D&D 5e ──────────────────────────────────────────────────────────────

const CLASS_DATA = {
  barbarian:  { name: 'Barbare',     emoji: '🪓', hitDie: 12, isCaster: false },
  bard:       { name: 'Barde',       emoji: '🎵', hitDie: 8,  isCaster: true  },
  cleric:     { name: 'Clerc',       emoji: '✝️', hitDie: 8,  isCaster: true  },
  druid:      { name: 'Druide',      emoji: '🌿', hitDie: 8,  isCaster: true  },
  fighter:    { name: 'Guerrier',    emoji: '🛡️', hitDie: 10, isCaster: false },
  monk:       { name: 'Moine',       emoji: '👊', hitDie: 8,  isCaster: false },
  paladin:    { name: 'Paladin',     emoji: '⚜️', hitDie: 10, isCaster: true  },
  ranger:     { name: 'Rôdeur',      emoji: '🏹', hitDie: 10, isCaster: true  },
  rogue:      { name: 'Roublard',    emoji: '🗡️', hitDie: 8,  isCaster: false },
  sorcerer:   { name: 'Ensorceleur', emoji: '✨', hitDie: 6,  isCaster: true  },
  warlock:    { name: 'Sorcier',     emoji: '👁️', hitDie: 8,  isCaster: true  },
  wizard:     { name: 'Magicien',    emoji: '📚', hitDie: 6,  isCaster: true  },
};

// Niveaux avec Amélioration de Caractéristiques (ASI)
const ASI_LEVELS = {
  default:  [4, 8, 12, 16, 19],
  fighter:  [4, 6, 8, 12, 14, 16, 19],
  rogue:    [4, 8, 10, 12, 16, 19],
};

const STAT_LABELS = {
  str: 'Force', dex: 'Dextérité', con: 'Constitution',
  int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme',
};

// Capacités notables par niveau (extrait SRD, illustratif)
const CLASS_FEATURES = {
  barbarian: {
    2: ['Témérité', 'Détection du danger'],
    3: ['Voie du berserker'],
    4: ['ASI'],
    5: ['Attaque supplémentaire', 'Mouvement rapide'],
  },
  bard: {
    2: ['Chant reposant', 'Collège des bardes'],
    3: ['Expertise', 'Inspiration bardique (d8)'],
    4: ['ASI'],
    5: ['Source d\'inspiration', 'Réduction des dégâts'],
  },
  cleric: {
    2: ['Conduit divin (1/repos)'],
    3: ['Conduit divin : 2e option'],
    4: ['ASI'],
    5: ['Destruction des morts-vivants'],
  },
  fighter: {
    2: ['Élan d\'action'],
    3: ['Archétype martial'],
    4: ['ASI'],
    5: ['Attaque supplémentaire'],
    6: ['ASI'],
  },
  rogue: {
    2: ['Ruse (2d6)', 'Esquive instinctive'],
    3: ['Archétype roublard'],
    4: ['ASI'],
    5: ['Attaque sournoise (3d6)', 'Esquive totale'],
  },
  wizard: {
    2: ['Tradition arcanique'],
    3: ['Niveau de sorts 2'],
    4: ['ASI'],
    5: ['Niveau de sorts 3'],
  },
  default: {
    2: ['Nouvelle capacité de classe'],
    3: ['Archétype / sous-classe'],
    4: ['ASI'],
    5: ['Capacité avancée'],
  },
};

function getFeatures(classId, level) {
  const table = CLASS_FEATURES[classId] || CLASS_FEATURES.default;
  return table[level] || [`Capacité de niveau ${level}`];
}

function getClassData(className) {
  const key = Object.keys(CLASS_DATA).find(k =>
    CLASS_DATA[k].name.toLowerCase() === (className || '').toLowerCase() || k === (className || '').toLowerCase()
  );
  return CLASS_DATA[key] || { name: className, emoji: '⚔️', hitDie: 8, isCaster: false, key: 'default' };
}

function getAsiLevels(classId) {
  return ASI_LEVELS[classId] || ASI_LEVELS.default;
}

function modifier(score) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ── Composants UI ────────────────────────────────────────────────────────────

function StepDot({ n, current }) {
  const state = n < current ? 'done' : n === current ? 'active' : 'idle';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.85rem',
        background: state === 'done' ? '#d97706' : state === 'active' ? '#f59e0b' : '#1e293b',
        border: state === 'idle' ? '2px solid #334155' : '2px solid #f59e0b',
        color: state === 'idle' ? '#64748b' : '#fff',
        transition: 'all 0.3s',
      }}>
        {state === 'done' ? '✓' : n}
      </div>
    </div>
  );
}

function DieButton({ sides, rolling, rolled, onRoll }) {
  return (
    <button
      onClick={onRoll}
      disabled={rolling || rolled !== null}
      style={{
        width: 96, height: 96,
        borderRadius: '1rem',
        background: rolled !== null ? 'linear-gradient(135deg,#92400e,#b45309)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
        border: `3px solid ${rolled !== null ? '#f59e0b' : '#334155'}`,
        color: rolled !== null ? '#fbbf24' : '#94a3b8',
        fontSize: rolled !== null ? '2rem' : '1rem',
        fontWeight: 900,
        cursor: rolled !== null ? 'default' : 'pointer',
        transition: 'all 0.3s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4,
        transform: rolling ? 'rotate(15deg) scale(0.95)' : 'rotate(0) scale(1)',
        fontFamily: 'Cinzel, serif',
      }}
    >
      {rolling ? '...' : rolled !== null ? rolled : (
        <>
          <span style={{ fontSize: '1.5rem' }}>🎲</span>
          <span style={{ fontSize: '0.75rem' }}>d{sides}</span>
        </>
      )}
    </button>
  );
}

// ── Étapes ───────────────────────────────────────────────────────────────────

function StepAnnounce({ char, classData, newLevel, onNext }) {
  const features = getFeatures(
    Object.keys(CLASS_DATA).find(k => CLASS_DATA[k].name === char.class_name) || 'default',
    newLevel
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{classData.emoji}</div>
      <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
        {char.class_name?.toUpperCase()}
      </div>
      <h2 style={{
        fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Cinzel Decorative, Cinzel, serif',
        background: 'linear-gradient(90deg,#fbbf24,#f97316,#fbbf24)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '0.25rem',
      }}>
        NIVEAU {newLevel}
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {char.char_name} gagne de nouvelles capacités
      </p>

      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left',
      }}>
        <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          NOUVELLES CAPACITÉS
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {features.map((f, i) => (
            <li key={i} style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#d97706' }}>✦</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onNext} style={btnStyle}>
        Suivant : Dés de vie →
      </button>
    </div>
  );
}

function StepHitPoints({ char, classData, conMod, onNext }) {
  const [rolled, setRolled] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [choice, setChoice] = useState(null); // 'roll' | 'average'
  const avg = Math.ceil(classData.hitDie / 2) + 1;

  const handleRoll = () => {
    if (rolled !== null) return;
    setRolling(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * classData.hitDie) + 1;
      setRolled(result);
      setChoice('roll');
      setRolling(false);
    }, 500);
  };

  const handleAvg = () => {
    if (rolled !== null) return;
    setRolled(avg);
    setChoice('average');
  };

  const hpGain = rolled !== null ? Math.max(1, rolled + conMod) : null;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={h2Style}>Dés de vie</h2>
      <p style={subStyle}>Lance ton d{classData.hitDie} ou prends la valeur moyenne</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: '2rem 0' }}>
        <DieButton sides={classData.hitDie} rolling={rolling} rolled={rolled} onRoll={handleRoll} />
        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>ou</div>
        <button
          onClick={handleAvg}
          disabled={rolled !== null}
          style={{
            width: 96, height: 96, borderRadius: '1rem',
            background: choice === 'average' ? 'linear-gradient(135deg,#1e3a5f,#1e40af)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
            border: `3px solid ${choice === 'average' ? '#60a5fa' : '#334155'}`,
            color: choice === 'average' ? '#93c5fd' : '#94a3b8',
            fontWeight: 700, cursor: rolled !== null ? 'default' : 'pointer',
            fontSize: '0.85rem', fontFamily: 'Cinzel, serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>⚖️</span>
          <span>Moy. {avg}</span>
        </button>
      </div>

      {hpGain !== null && (
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            GAIN DE PV
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span style={{ color: '#94a3b8' }}>{rolled}</span>
            <span style={{ color: '#64748b' }}>{conMod >= 0 ? '+' : ''}{conMod} (CON)</span>
            <span style={{ color: '#64748b' }}>=</span>
            <span style={{ color: '#4ade80', fontSize: '1.75rem' }}>+{hpGain} PV</span>
          </div>
          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {char.max_hp} → {char.max_hp + hpGain} PV max
          </p>
        </div>
      )}

      <button
        onClick={() => onNext(hpGain)}
        disabled={hpGain === null}
        style={{ ...btnStyle, opacity: hpGain === null ? 0.4 : 1, cursor: hpGain === null ? 'default' : 'pointer' }}
      >
        Suivant →
      </button>
    </div>
  );
}

function StepASI({ stats, onNext, onSkip }) {
  const [mode, setMode] = useState(null); // 'double' | 'split'
  const [picks, setPicks] = useState({});

  const totalPoints = mode === 'double' ? 2 : mode === 'split' ? 2 : 0;
  const used = Object.values(picks).reduce((s, v) => s + v, 0);
  const remaining = totalPoints - used;

  const addPoint = (stat) => {
    if (remaining <= 0) return;
    if (mode === 'double' && (picks[stat] || 0) >= 2) return;
    if (mode === 'split' && (picks[stat] || 0) >= 1) return;
    setPicks(p => ({ ...p, [stat]: (p[stat] || 0) + 1 }));
  };

  const removePoint = (stat) => {
    if (!picks[stat]) return;
    setPicks(p => ({ ...p, [stat]: p[stat] - 1 }));
  };

  const newStats = Object.fromEntries(
    Object.entries(stats).map(([k, v]) => [k, v + (picks[k] || 0)])
  );

  const canConfirm = mode !== null && remaining === 0;

  return (
    <div>
      <h2 style={{ ...h2Style, textAlign: 'center' }}>Amélioration de caractéristiques</h2>
      <p style={{ ...subStyle, textAlign: 'center' }}>Choisis comment répartir tes +2 points</p>

      {/* Choix du mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1.5rem 0' }}>
        {[
          { key: 'double', label: '+2 à une carac.', desc: 'Tout sur une stat' },
          { key: 'split',  label: '+1 / +1',         desc: 'Une sur deux stats' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => { setMode(opt.key); setPicks({}); }}
            style={{
              padding: '1rem', borderRadius: '0.75rem', textAlign: 'center',
              background: mode === opt.key ? 'linear-gradient(135deg,#92400e,#b45309)' : '#0f172a',
              border: `2px solid ${mode === opt.key ? '#f59e0b' : '#1e293b'}`,
              color: mode === opt.key ? '#fcd34d' : '#94a3b8',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontWeight: 700, fontFamily: 'Cinzel, serif', marginBottom: '0.25rem' }}>{opt.label}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Grille des stats */}
      {mode && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {Object.entries(STAT_LABELS).map(([key, label]) => {
              const base = stats[key] || 10;
              const bonus = picks[key] || 0;
              const total = base + bonus;
              const maxed = mode === 'double' ? bonus >= 2 : bonus >= 1;
              return (
                <div key={key} style={{
                  background: bonus > 0 ? '#1c2a1a' : '#0f172a',
                  border: `2px solid ${bonus > 0 ? '#22c55e' : '#1e293b'}`,
                  borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                    {label.substring(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: bonus > 0 ? '#4ade80' : '#e2e8f0' }}>
                    {total}
                    {bonus > 0 && <span style={{ fontSize: '0.9rem', color: '#22c55e' }}> +{bonus}</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>{modifier(total)}</div>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => removePoint(key)}
                      disabled={!bonus}
                      style={{ ...miniBtn, opacity: bonus ? 1 : 0.3 }}>−</button>
                    <button
                      onClick={() => addPoint(key)}
                      disabled={maxed || remaining === 0}
                      style={{ ...miniBtn, opacity: (maxed || remaining === 0) ? 0.3 : 1 }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ color: '#64748b', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Points restants : <strong style={{ color: remaining > 0 ? '#fbbf24' : '#22c55e' }}>{remaining}</strong>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onSkip}
          style={{ flex: 1, ...secondaryBtnStyle }}>
          Passer (Don)
        </button>
        <button
          onClick={() => onNext(picks, newStats)}
          disabled={!canConfirm}
          style={{ flex: 2, ...btnStyle, opacity: canConfirm ? 1 : 0.4, cursor: canConfirm ? 'pointer' : 'default' }}>
          Confirmer →
        </button>
      </div>
    </div>
  );
}

function StepConfirm({ char, newLevel, hpGain, statChanges, onConfirm, saving }) {
  const newMaxHp = char.max_hp + (hpGain || 0);
  const hasASI = Object.values(statChanges || {}).some(v => v > 0);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
      <h2 style={h2Style}>Prêt à confirmer ?</h2>
      <p style={subStyle}>{char.char_name} — Niveau {newLevel}</p>

      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '1rem', padding: '1.25rem', margin: '1.5rem 0', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Row label="Niveau" value={`${char.level} → ${newLevel}`} color="#fbbf24" />
          {hpGain > 0 && (
            <Row label="PV max" value={`${char.max_hp} → ${newMaxHp} (+${hpGain})`} color="#4ade80" />
          )}
          {hasASI && Object.entries(statChanges).filter(([, v]) => v > 0).map(([k, v]) => (
            <Row key={k} label={STAT_LABELS[k]}
              value={`${(char.sheet_data?.stats?.[k] || 10)} → ${(char.sheet_data?.stats?.[k] || 10) + v} (+${v})`}
              color="#60a5fa" />
          ))}
        </div>
      </div>

      <button onClick={onConfirm} disabled={saving} style={btnStyle}>
        {saving ? 'Sauvegarde...' : '✦ Confirmer la montée de niveau'}
      </button>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}

// ── Styles partagés ───────────────────────────────────────────────────────────

const btnStyle = {
  width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
  background: 'linear-gradient(135deg,#b45309,#d97706)',
  border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
  cursor: 'pointer', fontFamily: 'Cinzel, serif', letterSpacing: '0.03em',
  transition: 'all 0.2s',
};

const secondaryBtnStyle = {
  padding: '0.875rem', borderRadius: '0.75rem',
  background: 'transparent',
  border: '2px solid #334155', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem',
  cursor: 'pointer', transition: 'all 0.2s',
};

const h2Style = {
  fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Cinzel, serif',
  color: '#fbbf24', marginBottom: '0.25rem',
};

const subStyle = {
  color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0',
};

const miniBtn = {
  width: 24, height: 24, borderRadius: '0.25rem',
  background: '#1e293b', border: '1px solid #334155',
  color: '#94a3b8', cursor: 'pointer', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.9rem', lineHeight: 1,
};

// ── Page principale ───────────────────────────────────────────────────────────

export default function LevelUpWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [char, setChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Données accumulées à travers les étapes
  const [hpGain, setHpGain] = useState(0);
  const [statChanges, setStatChanges] = useState({});

  useEffect(() => { loadChar(); }, [id]);

  const loadChar = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data, error: err } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (err || !data) { setError('Personnage introuvable.'); setLoading(false); return; }
      if (!data.level_up_pending) { navigate(`/character/${id}`); return; }
      setChar(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080604' }}>
        <div style={{ color: '#fbbf24', fontSize: '1.25rem' }}>Chargement...</div>
      </div>
    );
  }

  if (error || !char) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#080604', padding: '1rem' }}>
        <p style={{ color: '#f87171' }}>{error || 'Erreur'}</p>
        <button onClick={() => navigate('/player')} style={{ color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer' }}>← Retour</button>
      </div>
    );
  }

  const classData = getClassData(char.class_name);
  const classId   = Object.keys(CLASS_DATA).find(k => CLASS_DATA[k].name === char.class_name) || 'default';
  const newLevel  = char.level + 1;
  const conScore  = char.sheet_data?.stats?.con ?? 10;
  const conMod    = Math.floor((conScore - 10) / 2);
  const isAsiLevel = getAsiLevels(classId).includes(newLevel);

  // Nombre total d'étapes selon si c'est un niveau ASI
  const totalSteps = isAsiLevel ? 4 : 3;

  const handleHpNext = (gain) => {
    setHpGain(gain || 0);
    setStep(isAsiLevel ? 3 : 4);
  };

  const handleAsiNext = (picks, _newStats) => {
    setStatChanges(picks);
    setStep(4);
  };

  const handleAsiSkip = () => {
    setStatChanges({});
    setStep(4);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const currentStats = char.sheet_data?.stats || {};
      const newStats = { ...currentStats };
      Object.entries(statChanges).forEach(([k, v]) => {
        newStats[k] = (newStats[k] || 10) + v;
      });

      await updateCharacter(id, {
        max_hp:     char.max_hp + hpGain,
        current_hp: char.current_hp + hpGain,
        sheet_data: { ...char.sheet_data, stats: newStats, level_up_history: [
          ...(char.sheet_data?.level_up_history || []),
          { level: newLevel, hpGain, statChanges, date: new Date().toISOString() },
        ]},
      });

      // Appliquer niveau + effacer le flag
      await supabase
        .from('characters')
        .update({ level: newLevel, level_up_pending: false })
        .eq('id', id);

      navigate(`/character/${id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const stepLabels = isAsiLevel
    ? ['Annonce', 'PV', 'Carac.', 'Bilan']
    : ['Annonce', 'PV', 'Bilan'];

  return (
    <div style={{
      minHeight: '100vh', padding: '3rem 1rem',
      background: 'linear-gradient(135deg,#080604 0%,#0F0A06 60%,#160E08 100%)',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Retour */}
        <button onClick={() => navigate(`/character/${id}`)}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          ← Annuler
        </button>

        {/* Barre de progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2.5rem' }}>
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const state = n < step ? 'done' : n === step ? 'active' : 'idle';
            return (
              <React.Fragment key={n}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem',
                    background: state === 'done' ? '#d97706' : state === 'active' ? '#f59e0b' : '#1e293b',
                    border: `2px solid ${state === 'idle' ? '#334155' : '#f59e0b'}`,
                    color: state === 'idle' ? '#64748b' : '#fff',
                    transition: 'all 0.3s',
                  }}>
                    {state === 'done' ? '✓' : n}
                  </div>
                  <span style={{ color: state === 'active' ? '#fbbf24' : '#475569', fontSize: '0.65rem', fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, background: n < step ? '#d97706' : '#1e293b',
                    marginBottom: 18, transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Carte */}
        <div style={{
          background: 'linear-gradient(135deg,#0f0a06,#1a1208)',
          border: '2px solid #292116',
          borderRadius: '1.5rem', padding: '2rem',
          boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        }}>
          {step === 1 && (
            <StepAnnounce
              char={char} classData={classData} newLevel={newLevel}
              onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <StepHitPoints
              char={char} classData={classData} conMod={conMod}
              onNext={handleHpNext} />
          )}
          {step === 3 && isAsiLevel && (
            <StepASI
              stats={char.sheet_data?.stats || {}}
              onNext={handleAsiNext}
              onSkip={handleAsiSkip} />
          )}
          {step === 4 && (
            <StepConfirm
              char={char} newLevel={newLevel}
              hpGain={hpGain} statChanges={statChanges}
              onConfirm={handleConfirm} saving={saving} />
          )}
        </div>

        {error && (
          <div style={{ marginTop: '1rem', color: '#f87171', textAlign: 'center', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
