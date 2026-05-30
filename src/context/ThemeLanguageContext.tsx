import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

type Theme = 'light' | 'dark';
type Language = 'id' | 'en';
export type StoreTheme = 'cyber_neon' | 'clean_white' | 'gold_luxury' | 'blue_fintech' | 'purple_hologram';

type ThemeLanguageContextType = {
  theme: Theme;
  language: Language;
  storeTheme: StoreTheme;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setStoreTheme: (theme: StoreTheme) => void;
  t: (key: string) => string;
};

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Always default to dark initially on first load/visit
    return 'dark';
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'id';
  });

  const [storeTheme, setStoreThemeState] = useState<StoreTheme>(() => {
    return (localStorage.getItem('store_theme') as StoreTheme) || 'cyber_neon';
  });

  // Translation function
  const t = (key: string): string => {
    const dict = translations[language] || translations.id;
    return dict[key] || key;
  };

  // Combined effect to manage dark/light class toggling and localStorage synchronization
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    localStorage.setItem('store_theme', storeTheme);
  }, [theme, storeTheme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setStoreTheme = (newTheme: StoreTheme) => {
    setStoreThemeState(newTheme);
  };

  return (
    <ThemeLanguageContext.Provider value={{ theme, language, storeTheme, toggleTheme, setLanguage, setStoreTheme, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  return context;
};

