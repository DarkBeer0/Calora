import { ACTIVITY_LEVELS, GOALS } from '../constants/nutrition';
import type { UserProfile, NutritionTarget } from '../types';

/**
 * Mifflin-St Jeor equation for BMR (Basal Metabolic Rate)
 * Men:   10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(profile: UserProfile): number {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

/**
 * TDEE & macro targets based on user weight and goals.
 *
 * Protein: weight-based
 *   - lose:     2.0 g/kg (preserve muscle in deficit)
 *   - maintain: 1.6 g/kg
 *   - gain:     1.8 g/kg
 *
 * Fat: 25% of TDEE (min 0.8 g/kg)
 * Carbs: remaining calories
 */
export function calculateDailyTarget(profile: UserProfile): NutritionTarget {
  const bmr = calculateBMR(profile);
  const activity = ACTIVITY_LEVELS[profile.activityLevel];
  const goal = GOALS[profile.goal];

  const tdee = bmr * activity.factor;
  const calories = Math.round(tdee + goal.offset);

  // Protein based on body weight and goal
  const proteinPerKg: Record<string, number> = {
    lose: 2.0,
    maintain: 1.6,
    gain: 1.8,
  };
  const protein = Math.round(profile.weight * proteinPerKg[profile.goal]);
  const proteinCalories = protein * 4;

  // Fat: 25% of total calories, but at least 0.8 g/kg
  const fatFromPercent = Math.round((calories * 0.25) / 9);
  const fatMinimum = Math.round(profile.weight * 0.8);
  const fat = Math.max(fatFromPercent, fatMinimum);
  const fatCalories = fat * 9;

  // Carbs: remaining calories
  const carbCalories = Math.max(calories - proteinCalories - fatCalories, 0);
  const carbs = Math.round(carbCalories / 4);

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
