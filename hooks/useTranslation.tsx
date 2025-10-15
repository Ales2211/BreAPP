
import React, { createContext, useContext, ReactNode } from 'react';
// Fix: Corrected import paths and renamed 'it' to 'itLocale'.
import { en } from '../locales/en';
import { itLocale } from '../locales/it';
import usePersistentState from './usePersistentState';

type Language = 'en' | 'it';

const translations = { en, it: itLocale };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = usePersistentState<Language>('brewflow_language', 'en');

  const t = (key: string): string => {
    // FIX: Corrected the incorrect type assertion which was causing a compile error.
    // This now safely accesses translations by casting the language object.
    return (translations[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
