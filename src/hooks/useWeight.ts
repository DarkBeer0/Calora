import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightEntry } from '../types';

const STORAGE_KEY = 'calora_weight';

export function useWeight() {
  const [allEntries, setAllEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Use ref to always have current entries in callbacks (avoid stale closure)
  const entriesRef = useRef<WeightEntry[]>(allEntries);
  entriesRef.current = allEntries;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const parsed = JSON.parse(raw);
        setAllEntries(parsed);
        entriesRef.current = parsed;
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (entries: WeightEntry[]) => {
    setAllEntries(entries);
    entriesRef.current = entries;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const addWeight = useCallback(async (weight: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const current = entriesRef.current;
    // Replace existing entry for today if any
    const filtered = current.filter((e) => e.date !== today);
    const entry: WeightEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: today,
      weight,
      createdAt: new Date().toISOString(),
    };
    const updated = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    await persist(updated);
    return entry;
  }, [persist]);

  const deleteWeight = useCallback(async (id: string) => {
    await persist(entriesRef.current.filter((e) => e.id !== id));
  }, [persist]);

  const sortedEntries = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));

  const latestWeight = sortedEntries.length > 0
    ? sortedEntries[sortedEntries.length - 1].weight
    : null;

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setAllEntries(parsed);
      entriesRef.current = parsed;
    }
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
