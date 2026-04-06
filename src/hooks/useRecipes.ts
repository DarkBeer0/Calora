import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, RecipeIngredient, FoodItem } from '../types';

const STORAGE_KEY = 'calora_recipes';

/** Compute totals from ingredients list */
export function computeRecipeNutrition(ingredients: RecipeIngredient[]) {
  let totalCalories = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
  let totalFiber = 0, totalSugars = 0, totalSaturatedFat = 0, totalSalt = 0;

  for (const { foodItem, grams } of ingredients) {
    const m = grams / 100;
    totalCalories += foodItem.caloriesPer100g * m;
    totalProtein += foodItem.proteinPer100g * m;
    totalFat += foodItem.fatPer100g * m;
    totalCarbs += foodItem.carbsPer100g * m;
    totalFiber += foodItem.fiberPer100g * m;
    totalSugars += foodItem.sugarsPer100g * m;
    totalSaturatedFat += foodItem.saturatedFatPer100g * m;
    totalSalt += foodItem.saltPer100g * m;
  }

  return { totalCalories, totalProtein, totalFat, totalCarbs, totalFiber, totalSugars, totalSaturatedFat, totalSalt };
}

/** Convert a Recipe to a FoodItem (per 1 serving = 100g equivalent) */
export function recipeToFoodItem(recipe: Recipe): FoodItem {
  const s = recipe.servings || 1;
  return {
    id: `recipe_${recipe.id}`,
    name: recipe.name,
    caloriesPer100g: recipe.totalCalories / s,
    proteinPer100g: recipe.totalProtein / s,
    fatPer100g: recipe.totalFat / s,
    carbsPer100g: recipe.totalCarbs / s,
    fiberPer100g: recipe.totalFiber / s,
    sugarsPer100g: recipe.totalSugars / s,
    saturatedFatPer100g: recipe.totalSaturatedFat / s,
    saltPer100g: recipe.totalSalt / s,
    source: 'custom',
  };
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setRecipes(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (items: Recipe[]) => {
    setRecipes(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addRecipe = useCallback(async (recipe: Recipe) => {
    await persist([...recipes, recipe]);
  }, [recipes, persist]);

  const updateRecipe = useCallback(async (recipe: Recipe) => {
    await persist(recipes.map((r) => r.id === recipe.id ? recipe : r));
  }, [recipes, persist]);

  const deleteRecipe = useCallback(async (id: string) => {
    await persist(recipes.filter((r) => r.id !== id));
  }, [recipes, persist]);

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setRecipes(JSON.parse(raw));
  }, []);

  return {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    isLoading,
    refresh,
  };
}
