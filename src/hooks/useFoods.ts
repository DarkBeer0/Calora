import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodItem } from '../types';

const RECENT_KEY = 'calora_recent_foods';
const FAVORITES_KEY = 'calora_favorite_foods';
const MAX_RECENT = 30;

export function useFoods() {
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(RECENT_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
    ]).then(([recentRaw, favRaw]) => {
      if (recentRaw) setRecentFoods(JSON.parse(recentRaw));
      if (favRaw) setFavoriteFoods(JSON.parse(favRaw));
    });
  }, []);

  const addRecent = useCallback(async (food: FoodItem) => {
    setRecentFoods((prev) => {
      const filtered = prev.filter((f) => f.id !== food.id);
      const updated = [food, ...filtered].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback(async (food: FoodItem) => {
    setFavoriteFoods((prev) => {
      const exists = prev.some((f) => f.id === food.id);
      const updated = exists ? prev.filter((f) => f.id !== food.id) : [food, ...prev];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((foodId: string) => {
    return favoriteFoods.some((f) => f.id === foodId);
  }, [favoriteFoods]);

  return { recentFoods, favoriteFoods, addRecent, toggleFavorite, isFavorite };
}
