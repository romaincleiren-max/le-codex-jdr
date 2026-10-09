import React, { useState } from 'react';
import { pdfEditions, languageName, downloadPdf } from '../lib/pdfEditions.mjs';
import { useLanguage } from '../i18n';

export default function PdfAction({ item, type, saga, onAddToCart, sessionId, languages: purchasedLanguages }) {
  const { language } = useLanguage();
  const langs = purchasedLanguages || Object.keys(pdfEditions(item));
  const [selection, setSelection] = useState('');
  const chosen = langs.includes(selection) ? selection : langs.includes(language) ? language : langs[0];
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const english = language === 'en';
  const free = item.isFree || !!sessionId;
  if (!langs.length) return <p className="p-3 rounded border border-current opacity-80" role="status">{english ? 'PDF coming soon' : 'PDF à venir'}</p>;
  const act = async () => {
    setError('');
    if (!free) { onAddToCart?.({ type, item, saga }); return; }
    setBusy(true);
    try { await downloadPdf({ type, id: item.id, language: chosen, sessionId }); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 py-2" onClick={e => e.stopPropagation()}>
    <label className="block text-sm">{english ? 'PDF language' : 'Langue du PDF'}
      <select aria-label={english ? 'PDF language' : 'Langue du PDF'} value={chosen} onChange={e => setSelection(e.target.value)} className="block w-full mt-1 rounded px-3 py-2 bg-slate-800 text-white border border-amber-600">
        {langs.map(lang => <option key={lang} value={lang}>{languageName(lang)}</option>)}
      </select>
    </label>
    <button type="button" disabled={busy} onClick={act} className="w-full rounded bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-3 disabled:opacity-50">
      {busy ? (english ? 'Preparing…' : 'Préparation…') : free ? (english ? 'Download PDF' : 'Télécharger le PDF') : `${english ? 'Add to basket' : 'Ajouter au panier'} · ${Number(item.price).toFixed(2)} €`}
    </button>
    {!free && <p className="text-xs">{english ? 'All available translations included.' : 'Toutes les traductions disponibles sont incluses.'}</p>}
    {error && <p role="alert" className="text-red-400">{error}</p>}
  </div>;
}
