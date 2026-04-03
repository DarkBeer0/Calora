import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WaterEntry } from '../types';

const STORAGE_KEY = 'calora_water';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWater() {
  const [allEntries, setAllEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAllEntries(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (entries: WaterEntry[]) => {
    setAllEntries(entries);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const addWater = useCallback(async (amount_ml: number) => {
    const entry: WaterEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: todayKey(),
      amount_ml,
      createdAt: new Date().toISOString(),
    };
    await persist([...allEntries, entry]);
  }, [allEntries, persist]);

  const removeLastEntry = useCallback(async () => {
    const today = todayKey();
    const todayEntries = allEntries.filter((e) => e.date === today);
    if (todayEntries.length === 0) return;
    const lastId = todayEntries[todayEntries.length - 1].id;
    await persist(allEntries.filter((e) => e.id !== lastId));
  }, [allEntries, persist]);

  const todayEntries = allEntries.filter((e) => e.date === todayKey());
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount_ml, 0);

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setAllEntries(JSON.parse(raw));
  }, []);

  return {
    allEntries,
    todayEntries,
    todayTotal,
    addWater,
    removeLastEntry,
    isLoading,
    refresh,
  };
}
