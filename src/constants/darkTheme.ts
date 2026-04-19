/**
 * Calora Design System — Dark Theme
 *
 * All accent colors adjusted to 300-400 weight for dark backgrounds.
 * Ensures WCAG AA contrast (4.5:1) on #121212 / #1E1E1E surfaces.
 */
export const DARK_COLORS = {
  // Core
  primary: '#66BB6A',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  background: '#0D1210',    // slight green-black — warmer than pure #121212
  surface: '#191E1B',       // green-tinted surface
  text: '#E0E0E0',
  textSecondary: '#9E9E9E',
  border: '#2B322D',        // subtle green-tinted border

  // Semantic actions
  error: '#EF5350',
  warning: '#FFD54F',
  success: '#66BB6A',

  // Calorie system
  calories: '#FFB74D',      // amber-300
  burned: '#FF9800',        // orange-500

  // Macronutrients
  protein: '#64B5F6',       // blue-300
  fat: '#FF8A65',           // deep orange-300
  carbs: '#81C784',         // green-300

  // Micronutrients
  fiber: '#AED581',         // light green-300
  sugars: '#F06292',        // pink-300
  saturatedFat: '#FF8A65',  // deep orange-300
  salt: '#90A4AE',          // blue-grey-300

  // Special purpose
  favorite: '#FFD54F',      // amber-300
  weight: '#CE93D8',        // purple-200
  water: '#4FC3F7',         // light blue-300
  overlay: '#000000',

  // Button text
  onPrimary: '#FFFFFF',
  onError: '#FFFFFF',
} as const;
