export interface UserProfile {
  id: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface NutritionTarget {
  calories: number;
  protein: number; // grams
  fat: number;     // grams
  carbs: number;   // grams
}

export interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  barcode?: string;
  source: 'openfoodfacts' | 'custom';
}

export interface MealEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItem: FoodItem;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  meals: MealEntry[];
}
