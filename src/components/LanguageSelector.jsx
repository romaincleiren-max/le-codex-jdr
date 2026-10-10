import React from 'react';
import { languages, useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  return <select aria-label={t('language.label')} title={t('language.label')} value={language}
    onChange={event => setLanguage(event.target.value)}
    className="max-w-[110px] min-w-0 rounded-lg border border-amber-600/40 bg-slate-800 px-2 py-2 text-xs text-amber-100">
    {Object.entries(languages).map(([code, name]) => <option key={code} value={code} lang={code}>{name}</option>)}
  </select>;
}
