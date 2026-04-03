import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealEntry, DailySummary } from '../types';

const STORAGE_KEY = 'calora_meals';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function useMeals() {
  const [allMeals, setAllMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAllMeals(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  // Persist helper
  const persist = useCallback(async (meals: MealEntry[]) => {
    setAllMeals(meals);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  }, []);

  // Add meal
  const addMeal = useCallback(async (entry: MealEntry) => {
    const updated = [...allMeals, entry];
    await persist(updated);
  }, [allMeals, persist]);

  // Delete meal
  const deleteMeal = useCallback(async (id: string) => {
    const updated = allMeals.filter((m) => m.id !== id);
    await persist(updated);
  }, [allMeals, persist]);

  // Update meal
  const updateMeal = useCallback(async (entry: MealEntry) => {
    const updated = allMeals.map((m) => m.id === entry.id ? entry : m);
    await persist(updated);
  }, [allMeals, persist]);

  // Get meals for a specific date
  const getMealsForDate = useCallback((date: string): MealEntry[] => {
    return allMeals.filter((m) => m.date === date);
  }, [allMeals]);

  // Copy meals from a date to today
  const copyMealsToToday = useCallback(async (date: string) => {
    const meals = getMealsForDate(date);
    const today = todayKey();
    const copies = meals.map((m) => ({
      ...m,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: today,
      createdAt: new Date().toISOString(),
    }));
    await persist([...allMeals, ...copies]);
  }, [allMeals, getMealsForDate, persist]);

  // Get today's meals
  const todayMeals = getMealsForDate(todayKey());

  // Get daily summary
  const getDailySummary = useCallback((date: string): DailySummary => {
    const meals = getMealsForDate(date);
    return {
      date,
      totalCalories: meals.reduce((s, m) => s + m.calories, 0),
      totalProtein: meals.reduce((s, m) => s + m.protein, 0),
      totalFat: meals.reduce((s, m) => s + m.fat, 0),
      totalCarbs: meals.reduce((s, m) => s + m.carbs, 0),
      totalFiber: meals.reduce((s, m) => s + (m.fiber ?? 0), 0),
      totalSugars: meals.reduce((s, m) => s + (m.sugars ?? 0), 0),
      totalSaturatedFat: meals.reduce((s, m) => s + (m.saturatedFat ?? 0), 0),
      totalSalt: meals.reduce((s, m) => s + (m.salt ?? 0), 0),
      meals,
    };
  }, [getMealsForDate]);

  const todaySummary = getDailySummary(todayKey());

  // Get unique dates that have meals (for history)
  const datesWithMeals = [...new Set(allMeals.map((m) => m.date))].sort().reverse();

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setAllMeals(JSON.parse(raw));
  }, []);

  return {
    allMeals,
    todayMeals,
    todaySummary,
    datesWithMeals,
    addMeal,
    deleteMeal,
    updateMeal,
    copyMealsToToday,
    getMealsForDate,
    getDailySummary,
    isLoading,
    refresh,
  };
}
