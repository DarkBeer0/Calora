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
  /** Create a tinted background: tint('#FF9800', 0.12) → 'rgba(255,152,0,0.12)' */
  tint: (hexColor: string, opacity: number) => string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const defaultCtx: ThemeContextType = {
  mode: 'light',
  colors: COLORS,
  toggle: () => {},
  isDark: false,
  tint: (hex, opacity) => hexToRgba(hex, opacity),
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

  const tint = useCallback(
    (hex: string, opacity: number) => hexToRgba(hex, opacity),
    []
  );

  return { mode, colors, toggle, isDark, tint };
}
