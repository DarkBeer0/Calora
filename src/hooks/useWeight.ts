import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightEntry } from '../types';

const STORAGE_KEY = 'calora_weight';

export function useWeight() {
  const [allEntries, setAllEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAllEntries(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (entries: WeightEntry[]) => {
    setAllEntries(entries);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const addWeight = useCallback(async (weight: number) => {
    const today = new Date().toISOString().slice(0, 10);
    // Replace existing entry for today if any
    const filtered = allEntries.filter((e) => e.date !== today);
    const entry: WeightEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: today,
      weight,
      createdAt: new Date().toISOString(),
    };
    await persist([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)));
  }, [allEntries, persist]);

  const deleteWeight = useCallback(async (id: string) => {
    await persist(allEntries.filter((e) => e.id !== id));
  }, [allEntries, persist]);

  const sortedEntries = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));

  const latestWeight = sortedEntries.length > 0
    ? sortedEntries[sortedEntries.length - 1].weight
    : null;

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setAllEntries(JSON.parse(raw));
  }, []);

  return {
    allEntries: sortedEntries,
    latestWeight,
    addWeight,
    deleteWeight,
    isLoading,
    refresh,
  };
}
