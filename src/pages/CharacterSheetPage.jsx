// ============================================================================
// CHARACTER SHEET PAGE — Fiche de personnage éditable pour le joueur
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { updateCharacter } from '../services/charactersService';

const STAT_NAMES = {
  str: 'Force', dex: 'Dextérité', con: 'Constitution',
  int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme',
};

function modifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function StatBox({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center bg-slate-800 border border-slate-700 rounded-xl p-3 gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        type="number" min={1} max={30} value={value}
        onChange={e => onChange(parseInt(e.target.value) || 10)}
        className="w-14 text-center text-xl font-black text-amber-200 bg-transparent border-none outline-none"
      />
      <span className="text-sm font-bold text-amber-400">{modifier(value)}</span>
    </div>
  );
}

export default function CharacterSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [char, setChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  // Champs éditables
  const [form, setForm] = useState({});

  useEffect(() => {
    loadChar();
  }, [id]);

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

      if (err || !data) {
        setError('Personnage introuvable ou accès refusé.');
        setLoading(false);
        return;
      }

      setChar(data);
      setForm({
        char_name: data.char_name,
        race_name: data.race_name,
        current_hp: data.current_hp,
        max_hp: data.max_hp,
        ac: data.ac,
        notes: data.notes || '',
        stats: data.sheet_data?.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateCharacter(id, {
        char_name: form.char_name,
        race_name: form.race_name,
        current_hp: form.current_hp,
        max_hp: form.max_hp,
        ac: form.ac,
        notes: form.notes,
        sheet_data: { ...char.sheet_data, stats: form.stats },
      });
      setChar(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setStat = (k, v) => setForm(f => ({ ...f, stats: { ...f.stats, [k]: v } }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #080604 0%, #160E08 100%)' }}>
        <div className="text-amber-300 text-xl">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ background: 'linear-gradient(135deg, #080604 0%, #160E08 100%)' }}>
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={() => navigate('/player')}
          className="text-amber-400 hover:text-amber-300 text-sm">← Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Navigation */}
        <button onClick={() => navigate('/player')}
          className="flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm mb-8 transition-colors">
          ← Mes personnages
        </button>

        {/* Bannière Level Up */}
        {char.level_up_pending && (
          <div className="mb-6 bg-yellow-500/10 border-2 border-yellow-500 rounded-2xl p-5 text-center animate-pulse">
            <div className="text-4xl mb-2">⬆️</div>
            <h3 className="text-xl font-black text-yellow-300 mb-1"
              style={{ fontFamily: 'Cinzel, serif' }}>
              Montée de niveau disponible !
            </h3>
            <p className="text-yellow-500 text-sm mb-4">
              L'admin t'a accordé le niveau {char.level + 1}
            </p>
            <button
              onClick={() => navigate(`/character/${id}/levelup`)}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-sm transition-all">
              ✦ Effectuer la montée de niveau
            </button>
          </div>
        )}

        {/* Header personnage */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-700 flex items-center justify-center bg-slate-800 flex-shrink-0">
            {char.portrait_url
              ? <img src={char.portrait_url} alt={char.char_name} className="w-full h-full object-cover" />
              : <span className="text-4xl">{char.portrait_emoji || '⚔️'}</span>
            }
          </div>
          <div>
            <h1 className="text-3xl font-black text-amber-200"
              style={{ fontFamily: 'Cinzel, serif' }}>
              {char.char_name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {char.race_name} · {char.class_name} · Niveau {char.level}
            </p>
          </div>
          <div className="ml-auto">
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); loadChar(); }}
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 text-sm transition-all">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-sm transition-all disabled:opacity-50">
                  {saving ? '...' : 'Sauvegarder'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-xl border border-amber-700 text-amber-400 hover:bg-amber-900/30 text-sm font-bold transition-all">
                ✏️ Modifier
              </button>
            )}
          </div>
        </div>

        {saved && (
          <div className="mb-4 bg-emerald-900/30 border border-emerald-600 rounded-xl px-4 py-2 text-emerald-300 text-sm text-center">
            ✓ Sauvegardé
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-600 rounded-xl px-4 py-2 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">

          {/* Stats de combat */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Combat</h2>
            <div className="grid grid-cols-3 gap-3">

              <div className="flex flex-col items-center bg-slate-800 border border-red-900/50 rounded-xl p-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">PV actuels</span>
                {editing
                  ? <input type="number" value={form.current_hp} onChange={e => set('current_hp', parseInt(e.target.value) || 0)}
                      className="w-16 text-center text-2xl font-black text-red-300 bg-transparent border-b border-red-600 outline-none" />
                  : <span className="text-2xl font-black text-red-300">{char.current_hp}</span>
                }
                <span className="text-xs text-slate-500 mt-1">/ {editing ? form.max_hp : char.max_hp}</span>
              </div>

              <div className="flex flex-col items-center bg-slate-800 border border-slate-700 rounded-xl p-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">PV max</span>
                {editing
                  ? <input type="number" value={form.max_hp} onChange={e => set('max_hp', parseInt(e.target.value) || 1)}
                      className="w-16 text-center text-2xl font-black text-amber-200 bg-transparent border-b border-amber-600 outline-none" />
                  : <span className="text-2xl font-black text-amber-200">{char.max_hp}</span>
                }
              </div>

              <div className="flex flex-col items-center bg-slate-800 border border-blue-900/50 rounded-xl p-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classe d'armure</span>
                {editing
                  ? <input type="number" value={form.ac} onChange={e => set('ac', parseInt(e.target.value) || 10)}
                      className="w-16 text-center text-2xl font-black text-blue-300 bg-transparent border-b border-blue-600 outline-none" />
                  : <span className="text-2xl font-black text-blue-300">{char.ac}</span>
                }
              </div>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Caractéristiques</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(STAT_NAMES).map(([key, label]) => (
                editing
                  ? <StatBox key={key} label={label} value={form.stats[key] || 10} onChange={v => setStat(key, v)} />
                  : (
                    <div key={key} className="flex flex-col items-center bg-slate-800 border border-slate-700 rounded-xl p-3 gap-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
                      <span className="text-xl font-black text-amber-200">{char.sheet_data?.stats?.[key] ?? 10}</span>
                      <span className="text-sm font-bold text-amber-400">{modifier(char.sheet_data?.stats?.[key] ?? 10)}</span>
                    </div>
                  )
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Notes & historique</h2>
            {editing
              ? <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={5}
                  placeholder="Historique, traits de personnalité, alliés, ennemis..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              : <p className="text-slate-400 text-sm whitespace-pre-wrap min-h-[60px]">
                  {char.notes || <span className="text-slate-600 italic">Aucune note.</span>}
                </p>
            }
          </div>

          {/* Équipement (lecture seule pour l'instant) */}
          {char.sheet_data?.equipment?.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Équipement</h2>
              <ul className="space-y-1">
                {char.sheet_data.equipment.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="text-slate-600">·</span> {item.name || item}
                    {item.quantity > 1 && <span className="text-slate-500 text-xs">×{item.quantity}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
