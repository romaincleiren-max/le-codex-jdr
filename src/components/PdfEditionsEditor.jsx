import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { pdfEditions, languageName } from '../lib/pdfEditions.mjs';

export default function PdfEditionsEditor({ item, onChange, onBusyChange = () => {} }) {
  const files = pdfEditions(item);
  const [extra, setExtra] = useState([]); const [newLang, setNewLang] = useState('');
  const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  const languages = [...new Set(['fr', 'en', ...Object.keys(files), ...extra])];
  const update = (lang, path) => {
    // Catalogue fields must never store a signed URL's bearer token.
    if (/^https?:\/\//i.test(path.trim())) path = path.trim().split(/[?#]/)[0];
    onChange(current => {
      const next = { ...pdfEditions(current) }; if (path.trim()) next[lang] = path.trim(); else delete next[lang];
      return { ...current, pdfFiles: next, pdfUrl: next.fr || '' };
    });
  };
  const upload = async (lang, file) => {
    if (!file) return;
    setError('');
    if (!/\.pdf$/i.test(file.name) || file.size > 50 * 1024 * 1024) { setError('Choisissez un PDF de moins de 50 Mo.'); return; }
    setBusy(lang); onBusyChange(true);
    try {
      const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (String.fromCharCode(...signature) !== '%PDF-') throw new Error('Ce fichier n’est pas un PDF valide.');
      const path = `editions/${crypto.randomUUID()}/${lang}.pdf`;
      const { error } = await supabase.storage.from('pdfs').upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (error) throw new Error('Import refusé. Vérifiez votre connexion administrateur et les permissions du stockage.');
      update(lang, path);
    } catch (e) { setError(e.message); } finally { setBusy(''); onBusyChange(false); }
  };
  return <fieldset className="space-y-3 border-2 border-amber-700 p-4 rounded text-amber-950">
    <legend className="font-bold">PDF disponibles par langue</legend>
    <p className="text-sm">Une langue apparaît sur le site dès qu’un PDF lui est attaché et que vous enregistrez. Sans fichier, le chapitre reste « À venir ».</p>
    {languages.map(lang => <div key={lang} className="space-y-1">
      <label className="block font-semibold">{languageName(lang)}
        <input type="text" value={files[lang] || ''} onChange={e => update(lang, e.target.value)} placeholder="Chemin dans le stockage pdfs" className="block w-full border rounded p-2 font-normal" />
      </label>
      <label className="block text-sm">Importer un PDF ({languageName(lang)})
        <input type="file" accept=".pdf,application/pdf" disabled={!!busy} onChange={e => { upload(lang, e.target.files?.[0]); e.target.value = ''; }} className="block w-full" />
      </label>
      {files[lang] && <button type="button" onClick={() => update(lang, '')} className="text-sm underline">Retirer cette traduction</button>}
    </div>)}
    <div className="flex gap-2">
      <input aria-label="Code de la nouvelle langue" value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="Code langue : es, de, it…" className="border rounded p-2 min-w-0" />
      <button type="button" onClick={() => { if (/^[a-z]{2}(?:-[A-Z]{2})?$/.test(newLang)) { setExtra([...extra, newLang]); setNewLang(''); setError(''); } else setError('Utilisez un code langue, par exemple es, de ou pt-BR.'); }}>Ajouter</button>
    </div>
    {busy && <p role="status">Import en cours… Attendez avant d’enregistrer.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </fieldset>;
}
