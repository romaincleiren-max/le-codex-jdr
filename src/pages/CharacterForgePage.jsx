// ============================================================================
// CHARACTER FORGE PAGE — Création & soumission de personnage
// Formulaire pour les joueurs, soumission vers Supabase (status='pending')
// ============================================================================

import React, { useState } from 'react';
import { submitCharacter } from '../services/charactersService';

const CLASSES = [
  { id: 'barbarian', name: 'Barbare',     emoji: '🪓' },
  { id: 'bard',      name: 'Barde',       emoji: '🎵' },
  { id: 'cleric',    name: 'Clerc',       emoji: '✝️' },
  { id: 'druid',     name: 'Druide',      emoji: '🌿' },
  { id: 'fighter',   name: 'Guerrier',    emoji: '🛡️' },
  { id: 'monk',      name: 'Moine',       emoji: '👊' },
  { id: 'paladin',   name: 'Paladin',     emoji: '⚜️' },
  { id: 'ranger',    name: 'Rôdeur',      emoji: '🏹' },
  { id: 'rogue',     name: 'Roublard',    emoji: '🗡️' },
  { id: 'sorcerer',  name: 'Ensorceleur', emoji: '✨' },
  { id: 'warlock',   name: 'Sorcier',     emoji: '👁️' },
  { id: 'wizard',    name: 'Magicien',    emoji: '📚' },
];

const RACES = [
  'Humain', 'Elfe', 'Nain', 'Halfelin', 'Gnome', 'Demi-Elfe',
  'Demi-Orc', 'Tieffelin', 'Dragonide', 'Aasimar', 'Autre',
];

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function CharacterForgePage({ onBack }) {
  const [step, setStep] = useState(1); // 1=identité, 2=stats, 3=portrait
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    playerName:  '',
    charName:    '',
    classId:     '',
    level:       1,
    raceName:    '',
    portraitUrl: '',
    currentHp:   10,
    maxHp:       10,
    ac:          10,
  });

  const cls = CLASSES.find(c => c.id === form.classId);
  const emoji = cls?.emoji || '⚔️';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canStep1 = form.playerName.trim() && form.charName.trim() && form.classId && form.raceName;
  const canStep2 = form.maxHp > 0 && form.ac > 0;

  const submit = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await submitCharacter({
        playerName:    form.playerName.trim(),
        charName:      form.charName.trim(),
        className:     cls?.name || form.classId,
        level:         form.level,
        raceName:      form.raceName,
        portraitUrl:   form.portraitUrl.trim() || null,
        portraitEmoji: emoji,
        currentHp:     form.currentHp,
        maxHp:         form.maxHp,
        ac:            form.ac,
        sheetData:     {},
      });
      setStatus('success');
    } catch (e) {
      setErrorMsg(e.message || 'Erreur inconnue');
      setStatus('error');
    }
  };

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">{emoji}</div>
          <h2 className="text-3xl font-black text-amber-300 mb-3" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
            Personnage soumis !
          </h2>
          <p className="text-slate-400 mb-2">
            <strong className="text-amber-200">{form.charName}</strong> est en attente d'approbation par l'admin.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Une fois approuvé, il apparaîtra dans le tracker d'initiative lors des sessions de jeu.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStatus(null); setStep(1); setForm({ playerName:'', charName:'', classId:'', level:1, raceName:'', portraitUrl:'', currentHp:10, maxHp:10, ac:10 }); }}
              className="px-6 py-3 rounded-xl border border-amber-600 text-amber-300 hover:bg-amber-900/30 font-bold text-sm transition-all">
              ✦ Créer un autre
            </button>
            <button onClick={onBack}
              className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-sm transition-all">
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4"
      style={{ background: 'linear-gradient(135deg, #080604 0%, #0F0A06 60%, #160E08 100%)' }}>

      <div className="max-w-xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-amber-300 mb-1"
            style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>
            ✦ Forge du Héros
          </h1>
          <p className="text-slate-400 text-sm">Créez votre personnage et soumettez-le à l'admin</p>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? 'bg-amber-600 text-amber-100' : 'bg-slate-800 text-slate-500 border border-slate-600'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-amber-600' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 shadow-2xl">

          {/* ÉTAPE 1 — Identité */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
                Identité du personnage
              </h2>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Nom du joueur *</label>
                <input value={form.playerName} onChange={e => set('playerName', e.target.value)}
                  placeholder="Votre prénom ou pseudo"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Nom du personnage *</label>
                <input value={form.charName} onChange={e => set('charName', e.target.value)}
                  placeholder="Aragorn, Hermione, ..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Classe *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CLASSES.map(c => (
                    <button key={c.id} onClick={() => set('classId', c.id)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        form.classId === c.id
                          ? 'border-amber-500 bg-amber-900/40 text-amber-200'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}>
                      <div className="text-xl mb-0.5">{c.emoji}</div>
                      <div>{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Race *</label>
                  <select value={form.raceName} onChange={e => set('raceName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors">
                    <option value="">Choisir...</option>
                    {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Niveau *</label>
                  <select value={form.level} onChange={e => set('level', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors">
                    {LEVELS.map(l => <option key={l} value={l}>Niveau {l}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!canStep1}
                className="w-full py-3.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-amber-100 font-bold transition-all">
                Suivant : Stats de combat →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 — Stats */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
                Stats de combat
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">PV max *</label>
                  <input type="number" min="1" value={form.maxHp}
                    onChange={e => { const v = parseInt(e.target.value)||1; set('maxHp', v); set('currentHp', v); }}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors text-center" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">PV actuels</label>
                  <input type="number" min="0" max={form.maxHp} value={form.currentHp}
                    onChange={e => set('currentHp', parseInt(e.target.value)||0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors text-center" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">CA *</label>
                  <input type="number" min="1" value={form.ac}
                    onChange={e => set('ac', parseInt(e.target.value)||10)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors text-center" />
                </div>
              </div>

              {/* Aperçu */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Aperçu</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                    {emoji}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{form.charName || '—'}</div>
                    <div className="text-xs text-slate-400">{cls?.name || '—'} · {form.raceName || '—'} · Niv. {form.level}</div>
                    <div className="text-xs text-slate-500 mt-0.5">❤️ {form.currentHp}/{form.maxHp} PV · 🛡 CA {form.ac}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 font-bold text-sm transition-all">
                  ← Retour
                </button>
                <button onClick={() => setStep(3)} disabled={!canStep2}
                  className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-amber-100 font-bold text-sm transition-all">
                  Suivant : Portrait →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Portrait + envoi */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-amber-300" style={{ fontFamily: 'Cinzel, serif' }}>
                Portrait (optionnel)
              </h2>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">URL d'une image</label>
                <input value={form.portraitUrl} onChange={e => set('portraitUrl', e.target.value)}
                  placeholder="https://… (imgur, Discord CDN, etc.)"
                  type="url"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
                <p className="text-xs text-slate-500 mt-1">Sinon, l'emoji de classe sera utilisé ({emoji})</p>
              </div>

              {/* Aperçu portrait */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-700/50 bg-slate-800 flex items-center justify-center">
                  {form.portraitUrl.trim()
                    ? <img src={form.portraitUrl.trim()} alt="portrait" className="w-full h-full object-cover"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                    : null}
                  <div className="text-4xl" style={{ display: form.portraitUrl.trim() ? 'none' : 'flex' }}>{emoji}</div>
                </div>
              </div>

              {/* Récap */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 text-sm space-y-1">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Récapitulatif</div>
                <div className="flex justify-between text-slate-300"><span className="text-slate-500">Joueur</span><span>{form.playerName}</span></div>
                <div className="flex justify-between text-slate-300"><span className="text-slate-500">Personnage</span><span>{form.charName}</span></div>
                <div className="flex justify-between text-slate-300"><span className="text-slate-500">Classe</span><span>{emoji} {cls?.name}</span></div>
                <div className="flex justify-between text-slate-300"><span className="text-slate-500">Race / Niveau</span><span>{form.raceName} · Niv. {form.level}</span></div>
                <div className="flex justify-between text-slate-300"><span className="text-slate-500">PV / CA</span><span>{form.maxHp} PV · CA {form.ac}</span></div>
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-sm text-center">⚠ {errorMsg}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 font-bold text-sm transition-all">
                  ← Retour
                </button>
                <button onClick={submit} disabled={status === 'loading'}
                  className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-amber-100 font-bold text-sm transition-all">
                  {status === 'loading' ? '⏳ Envoi…' : '✦ Soumettre le personnage'}
                </button>
              </div>

              <p className="text-xs text-slate-600 text-center">
                Le personnage sera visible dans le tracker une fois approuvé par l'admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
