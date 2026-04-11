import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'calora_streak';
const MEALS_KEY = 'calora_meals';

export interface StreakData {
  current: number;
  best: number;
  lastDate: string; // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ current: 0, best: 0, lastDate: '' });
  const [isLoading, setIsLoading] = useState(true);

  const recalculate = useCallback(async () => {
    try {
      const [streakRaw, mealsRaw] = await Promise.all([
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(MEALS_KEY),
      ]);

      const saved: StreakData = streakRaw
        ? JSON.parse(streakRaw)
        : { current: 0, best: 0, lastDate: '' };

      // Get unique dates with meals
      const meals = mealsRaw ? JSON.parse(mealsRaw) : [];
      const datesSet = new Set<string>(meals.map((m: any) => m.date));

      const today = todayKey();
      const yesterday = yesterdayKey();
      const hasToday = datesSet.has(today);
      const hasYesterday = datesSet.has(yesterday);

      let current = saved.current;
      let best = saved.best;

      if (saved.lastDate === today) {
        // Already counted today — no change
      } else if (saved.lastDate === yesterday && hasToday) {
        // Streak continues
        current += 1;
      } else if (hasToday) {
        // Gap or first day — start fresh, but count consecutive days backwards
        current = 0;
        const dates = [...datesSet].sort().reverse();
        for (const date of dates) {
          const check = new Date(today);
          check.setDate(check.getDate() - current);
          if (check.toISOString().slice(0, 10) === date) {
            current++;
          } else {
            break;
          }
        }
      } else if (saved.lastDate === yesterday || saved.lastDate === today) {
        // No meals today yet, but streak is alive from yesterday
        // Keep current value, don't update lastDate
        setStreak({ current, best, lastDate: saved.lastDate });
        setIsLoading(false);
        return;
      } else {
        // Streak broken
        current = 0;
      }

      if (current > best) best = current;

      const updated: StreakData = {
        current,
        best,
        lastDate: hasToday ? today : saved.lastDate,
      };

      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
      setStreak(updated);
    } catch {
      // Silent fail — streak is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  return { streak, isLoading, refresh: recalculate };
}
