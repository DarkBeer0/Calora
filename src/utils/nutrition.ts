import { ACTIVITY_LEVELS, GOALS } from '../constants/nutrition';
import type { UserProfile, NutritionTarget } from '../types';

/**
 * Mifflin-St Jeor equation for BMR (Basal Metabolic Rate)
 * Men:   10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161 + 5
 * Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(profile: UserProfile): number {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

export function calculateDailyTarget(profile: UserProfile): NutritionTarget {
  const bmr = calculateBMR(profile);
  const activity = ACTIVITY_LEVELS[profile.activityLevel];
  const goal = GOALS[profile.goal];

  const calories = Math.round(bmr * activity.factor + goal.offset);

  // Standard macro split: 30% protein, 25% fat, 45% carbs
  const protein = Math.round((calories * 0.3) / 4); // 4 kcal per gram
  const fat = Math.round((calories * 0.25) / 9);    // 9 kcal per gram
  const carbs = Math.round((calories * 0.45) / 4);  // 4 kcal per gram

  return { calories, protein, fat, carbs };
}

interface FoodNutrients {
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  sugarsPer100g: number;
  saturatedFatPer100g: number;
  saltPer100g: number;
}

export function calculateNutrition(foodItem: FoodNutrients, grams: number) {
  const ratio = grams / 100;
  const r = (v: number) => Math.round(v * ratio * 10) / 10;
  return {
    calories: Math.round(foodItem.caloriesPer100g * ratio),
    protein: r(foodItem.proteinPer100g),
    fat: r(foodItem.fatPer100g),
    carbs: r(foodItem.carbsPer100g),
    fiber: r(foodItem.fiberPer100g),
    sugars: r(foodItem.sugarsPer100g),
    saturatedFat: r(foodItem.saturatedFatPer100g),
    salt: r(foodItem.saltPer100g),
  };
}
