// Activity level multipliers for Mifflin-St Jeor formula
export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Сидячий образ жизни', factor: 1.2 },
  light: { label: 'Лёгкая активность (1-3 дня/нед)', factor: 1.375 },
  moderate: { label: 'Средняя активность (3-5 дней/нед)', factor: 1.55 },
  active: { label: 'Высокая активность (6-7 дней/нед)', factor: 1.725 },
  veryActive: { label: 'Очень высокая активность', factor: 1.9 },
} as const;

// Goal adjustments (calorie offset from maintenance)
export const GOALS = {
  lose: { label: 'Похудение', offset: -500 },
  maintain: { label: 'Поддержание', offset: 0 },
  gain: { label: 'Набор массы', offset: 300 },
} as const;

// Daily recommended values (WHO / РФ norms)
export const DAILY_MICRO_TARGETS = {
  fiber: 25,          // г — ВОЗ рекомендация
  sugars: 50,         // г — максимум (ВОЗ: <10% от калорий)
  saturatedFat: 20,   // г — максимум (~10% от 2000 ккал)
  salt: 5,            // г — максимум ВОЗ
} as const;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};
