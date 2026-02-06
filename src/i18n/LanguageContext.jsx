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

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
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
