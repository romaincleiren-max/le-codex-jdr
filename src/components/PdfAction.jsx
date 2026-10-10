import React, { useState } from 'react';
import { pdfEditions, languageName, downloadPdf } from '../lib/pdfEditions.mjs';
import { useLanguage } from '../i18n';

export default function PdfAction({ item, type, saga, onAddToCart, sessionId, languages: purchasedLanguages }) {
  const { language, t } = useLanguage();
  const langs = purchasedLanguages || Object.keys(pdfEditions(item));
  const [selection, setSelection] = useState('');
  const chosen = langs.includes(selection) ? selection : langs.includes(language) ? language : langs[0];
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const free = item.isFree || !!sessionId;
  if (!langs.length) return <p className="p-3 rounded border border-current opacity-80" role="status">{t('pdf.soon')}</p>;
  const act = async () => {
    setError('');
    if (!free) { onAddToCart?.({ type, item, saga }); return; }
    setBusy(true);
    try { await downloadPdf({ type, id: item.id, language: chosen, sessionId }); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 py-2" onClick={e => e.stopPropagation()}>
    <label className="block text-sm">{t('pdf.language')}
      <select aria-label={t('pdf.language')} value={chosen} onChange={e => setSelection(e.target.value)} className="block w-full mt-1 rounded px-3 py-2 bg-slate-800 text-white border border-amber-600">
        {langs.map(lang => <option key={lang} value={lang}>{languageName(lang)}</option>)}
      </select>
    </label>
    <button type="button" disabled={busy} onClick={act} className="w-full rounded bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-3 disabled:opacity-50">
      {busy ? t('pdf.preparing') : free ? t('pdf.download') : `${t('book.addToCart')} · ${Number(item.price).toFixed(2)} €`}
    </button>
    {!free && <p className="text-xs">{t('pdf.included')}</p>}
    {error && <p role="alert" className="text-red-400">{error}</p>}
  </div>;
}
