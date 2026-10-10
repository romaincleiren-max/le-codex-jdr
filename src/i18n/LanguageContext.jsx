import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import fr from './fr';
import en from './en';
import { extraLanguages } from './catalogue';
import { flowTranslations } from './flows';
import tagMaps from './tags';

export const languages = { fr: 'Français', en: 'English', es: 'Español', pt: 'Português', de: 'Deutsch' };
const translations = Object.fromEntries(Object.entries({ fr, en, ...extraLanguages }).map(([code, dictionary]) => [code, { ...dictionary, ...flowTranslations[code] }]));

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, updateLanguage] = useState(() => {
    try { const saved = localStorage.getItem('le-codex-lang'); return Object.hasOwn(languages, saved) ? saved : 'fr'; }
    catch { return 'fr'; }
  });

  const setLanguage = useCallback((next) => {
    if (!Object.hasOwn(languages, next)) return;
    updateLanguage(next);
    try { localStorage.setItem('le-codex-lang', next); } catch { /* Storage can be disabled. */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value) return value;
    return keys.reduce((entry, k) => entry?.[k], translations.fr) || key;
  }, [language]);

  // Traduit un tag FR en EN via le mapping tagMap
  const tTag = useCallback((tag) => {
    if (language === 'fr') return tag;
    const map = tagMaps[language] || translations[language].tagMap;
    return map?.[tag] || tag;
  }, [language]);

  // Traduit une durée "4-6 heures" → "4-6 hours"
  const tDuration = useCallback((duration) => {
    if (language === 'fr' || !duration) return duration;
    const [singular, plural] = { en: ['hour', 'hours'], es: ['hora', 'horas'], pt: ['hora', 'horas'], de: ['Stunde', 'Stunden'] }[language];
    return duration.replace(/heures/gi, plural).replace(/heure/gi, singular);
  }, [language]);

  // Lit un champ localisé : tf(scenario, 'description') → scenario.description_en || scenario.description
  const tf = useCallback((obj, field) => {
    if (!obj) return '';
    if (language !== 'fr') {
      const localized = obj[field + '_' + language] || obj[field + language[0].toUpperCase() + language.slice(1)];
      if (localized) return localized;
    }
    return obj[field] || '';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tTag, tDuration, tf }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
