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

export function calculateNutrition(foodItem: { caloriesPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number }, grams: number) {
  const ratio = grams / 100;
  return {
    calories: Math.round(foodItem.caloriesPer100g * ratio),
    protein: Math.round(foodItem.proteinPer100g * ratio * 10) / 10,
    fat: Math.round(foodItem.fatPer100g * ratio * 10) / 10,
    carbs: Math.round(foodItem.carbsPer100g * ratio * 10) / 10,
  };
}
