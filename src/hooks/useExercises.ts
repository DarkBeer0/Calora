import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseEntry } from '../types';

const STORAGE_KEY = 'calora_exercises';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useExercises() {
  const [allExercises, setAllExercises] = useState<ExerciseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAllExercises(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (items: ExerciseEntry[]) => {
    setAllExercises(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addExercise = useCallback(async (entry: ExerciseEntry) => {
    await persist([...allExercises, entry]);
  }, [allExercises, persist]);

  const deleteExercise = useCallback(async (id: string) => {
    await persist(allExercises.filter((e) => e.id !== id));
  }, [allExercises, persist]);

  const getExercisesForDate = useCallback((date: string) => {
    return allExercises.filter((e) => e.date === date);
  }, [allExercises]);

  const todayExercises = getExercisesForDate(todayKey());
  const todayBurned = todayExercises.reduce((sum, e) => sum + e.caloriesBurned, 0);

  return {
    allExercises,
    todayExercises,
    todayBurned,
    addExercise,
    deleteExercise,
    getExercisesForDate,
    isLoading,
  };
}
