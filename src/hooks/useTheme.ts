import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { DARK_COLORS } from '../constants/darkTheme';

const STORAGE_KEY = 'calora_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof COLORS;
  toggle: () => void;
  isDark: boolean;
}

const defaultCtx: ThemeContextType = {
  mode: 'light',
  colors: COLORS,
  toggle: () => {},
  isDark: false,
};

export const ThemeContext = createContext<ThemeContextType>(defaultCtx);

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeProvider() {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'dark' || val === 'light') setMode(val);
    });
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? (DARK_COLORS as unknown as typeof COLORS) : COLORS;

  return { mode, colors, toggle, isDark };
}
