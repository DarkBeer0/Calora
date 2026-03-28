import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ru, type TranslationKey } from './ru';
import { en } from './en';
import { pl } from './pl';

export type Language = 'ru' | 'en' | 'pl';

const translations: Record<Language, Record<TranslationKey, string>> = { ru, en, pl };

export const LANGUAGE_LABELS: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  pl: 'Polski',
};

const STORAGE_KEY = 'calora_language';

export interface I18nContextType {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
}

const defaultCtx: I18nContextType = {
  lang: 'ru',
  t: (key) => ru[key],
  setLang: () => {},
};

export const I18nContext = createContext<I18nContextType>(defaultCtx);

export function useI18n() {
  return useContext(I18nContext);
}

export function useI18nProvider() {
  const [lang, setLangState] = useState<Language>('ru');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'ru' || val === 'en' || val === 'pl') setLangState(val);
    });
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] ?? ru[key] ?? key,
    [lang]
  );

  return { lang, t, setLang };
}

export type { TranslationKey };
