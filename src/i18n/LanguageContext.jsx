import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import fr from './fr';
import en from './en';

const translations = { fr, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('le-codex-lang') || 'fr';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'fr' ? 'en' : 'fr';
      localStorage.setItem('le-codex-lang', next);
      return next;
    });
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
    return value || key;
  }, [language]);

  // Traduit un tag FR en EN via le mapping tagMap
  const tTag = useCallback((tag) => {
    if (language === 'fr') return tag;
    const map = translations.en.tagMap;
    return map?.[tag] || tag;
  }, [language]);

  // Traduit une durée "4-6 heures" → "4-6 hours"
  const tDuration = useCallback((duration) => {
    if (language === 'fr' || !duration) return duration;
    return duration
      .replace(/heures/gi, 'hours')
      .replace(/heure/gi, 'hour');
  }, [language]);

  // Lit un champ localisé : tf(scenario, 'description') → scenario.description_en || scenario.description
  const tf = useCallback((obj, field) => {
    if (!obj) return '';
    if (language === 'en') {
      const enField = obj[field + '_en'] || obj[field + 'En'];
      if (enField) return enField;
    }
    return obj[field] || '';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, tTag, tDuration, tf }}>
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
