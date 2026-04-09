/**
 * Calora Design System — Light Theme
 *
 * Color principles:
 * 1. Primary (green) — CTAs, success states, progress
 * 2. Calories (warm amber) — eaten calories, calorie values
 * 3. Burned (soft coral) — exercise, burned calories
 * 4. Macros — consistent hues: protein=blue, fat=orange, carbs=green
 * 5. Micros — muted tones for secondary nutrients
 * 6. Error (red) — destructive actions only, NOT for exercise
 * 7. All accent colors tested for WCAG AA contrast on #FFFFFF / #FAFAFA
 */
export const COLORS = {
  // Core
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',

  // Semantic actions
  error: '#D32F2F',         // destructive only (delete, validation)
  warning: '#F9A825',       // limits, approaching danger
  success: '#388E3C',       // success toasts, confirmations

  // Calorie system — single warm palette
  calories: '#FB8C00',      // eaten calories (amber-600)
  burned: '#EF6C00',        // burned calories (orange-800) — same family, darker

  // Macronutrients — distinct hues, medium saturation
  protein: '#1E88E5',       // blue-600
  fat: '#F4511E',           // deep orange-600
  carbs: '#43A047',         // green-600

  // Micronutrients — muted, secondary importance
  fiber: '#7CB342',         // light green-600
  sugars: '#D81B60',        // pink-600
  saturatedFat: '#FF7043',  // deep orange-400
  salt: '#78909C',          // blue-grey-400

  // Special purpose
  favorite: '#FFB300',      // star / bookmark (amber-600)
  weight: '#8E24AA',        // weight tracking (purple-600)
  water: '#29B6F6',         // water tracking base (light blue-400)
  overlay: '#000000',       // modal overlays (use with opacity)

  // Button text on colored backgrounds
  onPrimary: '#FFFFFF',
  onError: '#FFFFFF',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Standard opacity levels for tinted backgrounds.
 * Use `tint(color, level)` helper or `${color}${ALPHA_HEX[level]}`.
 */
export const ALPHA_HEX = {
  '04': '0A',   // 4%  — very subtle surface tint
  '08': '14',   // 8%  — light surface tint
  '12': '1F',   // 12% — ring/track backgrounds
  '15': '26',   // 15% — icon badge backgrounds
  '20': '33',   // 20% — active badge backgrounds
  '30': '4D',   // 30% — overlay light
} as const;
