import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { CaloriesWidget } from './CaloriesWidget';

const MEALS_KEY = 'calora_meals';
const PROFILE_KEY = 'calora_profile';
const STREAK_KEY = 'calora_streak';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Simple Mifflin-St Jeor + activity + goal calculation (mirrors utils/nutrition.ts) */
function calcTarget(profile: any): { calories: number; protein: number; fat: number; carbs: number } {
  const { age, weight, height, gender, activityLevel, goal } = profile;
  if (!age || !weight || !height) return { calories: 2000, protein: 100, fat: 70, carbs: 250 };

  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;

  const factors: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
  };
  const goalAdj: Record<string, number> = { lose: -500, maintain: 0, gain: 300 };

  const tdee = Math.round(bmr * (factors[activityLevel] ?? 1.55));
  const calories = Math.max(1200, tdee + (goalAdj[goal] ?? 0));
  const proteinG = goal === 'lose' ? 2.0 : goal === 'gain' ? 1.8 : 1.6;
  const protein = Math.round(weight * proteinG);
  const fat = Math.max(Math.round(weight * 0.8), Math.round((calories * 0.25) / 9));
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, fat, carbs };
}

async function getWidgetData() {
  try {
    const [mealsRaw, profileRaw, streakRaw] = await Promise.all([
      AsyncStorage.getItem(MEALS_KEY),
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(STREAK_KEY),
    ]);

    const meals: any[] = mealsRaw ? JSON.parse(mealsRaw) : [];
    const profile = profileRaw ? JSON.parse(profileRaw) : {};
    const streakData = streakRaw ? JSON.parse(streakRaw) : { current: 0 };

    const today = todayKey();
    const todayMeals = meals.filter((m) => m.date === today);

    const eaten = Math.round(todayMeals.reduce((s, m) => s + (m.calories || 0), 0));
    const protein = Math.round(todayMeals.reduce((s, m) => s + (m.protein || 0), 0));
    const fat = Math.round(todayMeals.reduce((s, m) => s + (m.fat || 0), 0));
    const carbs = Math.round(todayMeals.reduce((s, m) => s + (m.carbs || 0), 0));

    const target = calcTarget(profile);

    return {
      eaten,
      target: target.calories,
      remaining: target.calories - eaten,
      protein,
      fat,
      carbs,
      streak: streakData.current || 0,
    };
  } catch {
    return { eaten: 0, target: 2000, remaining: 2000, protein: 0, fat: 0, carbs: 0, streak: 0 };
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetName === 'CaloriesWidget') {
        const data = await getWidgetData();
        props.renderWidget(<CaloriesWidget data={data} />);
      }
      break;
    }

    case 'WIDGET_DELETED':
      // Nothing to clean up
      break;

    default:
      break;
  }
}
