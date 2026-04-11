import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, RecipeIngredient, FoodItem } from '../types';

const STORAGE_KEY = 'calora_recipes';

/** Compute totals from ingredients list */
/** Round to 1 decimal place to avoid float drift */
const r1 = (v: number) => Math.round(v * 10) / 10;

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

  return {
    totalCalories: Math.round(totalCalories),
    totalProtein: r1(totalProtein),
    totalFat: r1(totalFat),
    totalCarbs: r1(totalCarbs),
    totalFiber: r1(totalFiber),
    totalSugars: r1(totalSugars),
    totalSaturatedFat: r1(totalSaturatedFat),
    totalSalt: r1(totalSalt),
  };
}

/** Total weight of all ingredients in grams */
export function computeRecipeTotalWeight(ingredients: RecipeIngredient[]): number {
  return ingredients.reduce((sum, ing) => sum + ing.grams, 0);
}

/** Convert a Recipe to a FoodItem with proper per-100g values based on total weight */
export function recipeToFoodItem(recipe: Recipe): FoodItem {
  const totalWeight = computeRecipeTotalWeight(recipe.ingredients);
  // If no weight data, fall back to per-serving (legacy recipes)
  if (totalWeight <= 0) {
    const s = recipe.servings || 1;
    return {
      id: `recipe_${recipe.id}`,
      name: recipe.name,
      caloriesPer100g: Math.round(recipe.totalCalories / s),
      proteinPer100g: Math.round((recipe.totalProtein / s) * 10) / 10,
      fatPer100g: Math.round((recipe.totalFat / s) * 10) / 10,
      carbsPer100g: Math.round((recipe.totalCarbs / s) * 10) / 10,
      fiberPer100g: Math.round((recipe.totalFiber / s) * 10) / 10,
      sugarsPer100g: Math.round((recipe.totalSugars / s) * 10) / 10,
      saturatedFatPer100g: Math.round((recipe.totalSaturatedFat / s) * 10) / 10,
      saltPer100g: Math.round((recipe.totalSalt / s) * 100) / 100,
      source: 'custom',
    };
  }

  const factor = 100 / totalWeight;
  return {
    id: `recipe_${recipe.id}`,
    name: recipe.name,
    caloriesPer100g: Math.round(recipe.totalCalories * factor),
    proteinPer100g: Math.round(recipe.totalProtein * factor * 10) / 10,
    fatPer100g: Math.round(recipe.totalFat * factor * 10) / 10,
    carbsPer100g: Math.round(recipe.totalCarbs * factor * 10) / 10,
    fiberPer100g: Math.round(recipe.totalFiber * factor * 10) / 10,
    sugarsPer100g: Math.round(recipe.totalSugars * factor * 10) / 10,
    saturatedFatPer100g: Math.round(recipe.totalSaturatedFat * factor * 10) / 10,
    saltPer100g: Math.round(recipe.totalSalt * factor * 100) / 100,
    source: 'custom',
  };
}

/** Get grams for 1 serving of a recipe */
export function recipeServingGrams(recipe: Recipe): number {
  const totalWeight = computeRecipeTotalWeight(recipe.ingredients);
  const s = recipe.servings || 1;
  return totalWeight > 0 ? Math.round(totalWeight / s) : 100;
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
