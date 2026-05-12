# 🔥 Calora

A mobile calorie-tracking app with AI food analysis, macro/micronutrient tracking, water intake, and workouts.

<p align="center">
  <img src="assets/icon.png" width="120" alt="Calora Icon" />
</p>

## Overview

Calora helps you control your nutrition: log meals, calculate daily calorie and macro targets from your personal metrics, track micronutrients and water, and account for calories burned through exercise.

**Key features:**
- 🤖 **AI chat** — describe a meal or snap a photo and the AI computes calories and macros
- 🍳 **Recipes** — build compound dishes with AI ingredient recognition
- 📊 **Full tracking** — calories, protein/fat/carbs, micronutrients, water, exercises
- 💧 **Water visualization** — SVG human silhouette with a gradient fill
- 🔥 **Streak system** — track consecutive days of logging
- 📱 **Offline-first** — all data is stored on-device, no account required
- 🎨 **Semantic design system** — WCAG AA contrast, `tint()` utility for transparencies
- 🌙 **Dark mode** + 3 languages (RU / EN / PL)

## Tech stack

| Category | Stack |
|----------|------|
| **Framework** | React Native 0.81 + Expo SDK 54, TypeScript 5.9 |
| **Navigation** | React Navigation (Tab + Stack) |
| **Storage** | AsyncStorage (offline-first) |
| **AI** | Groq API (Llama 3.3 70B text + Llama 4 Scout vision) via Vercel proxy |
| **UI** | react-native-svg, react-native-chart-kit, expo-haptics |
| **Camera** | expo-camera (barcodes), expo-image-picker (food photos) |
| **Notifications** | expo-notifications (development build) |
| **Email** | Resend API (user feedback) |
| **Widgets** | react-native-android-widget (Android home-screen widget) |

## Architecture

```
┌──────────────┐                              ┌──────────────────┐
│  Mobile App  │  POST /api/ai-nutrition       │  Vercel Proxy    │     Groq API
│  (Expo)      │ ────────────────────────────> │  (CaloraAI)      │ ──────────────> Llama 3.3 / 4 Scout
│              │ <──────────────────────────── │                  │ <──────────────
│              │  { analysis: {...} }          │  POST /api/feedback          │
│              │ ────────────────────────────> │  ───────────────────> Resend ──> email
└──────────────┘                              └──────────────────┘
```

- API keys live **only on the server** (Vercel env)
- Rate limiting: 20 req/min (AI), 3 req/min (feedback)
- Client-side cap: 10 AI requests per day per device
- Photos: base64 up to ~5 MB, vision model for food recognition
- Feedback: Resend → developer's mailbox

## Design system

Calora uses a **semantic color system** with separate palettes for light and dark themes:

- **Semantic tokens**: `calories`, `burned`, `protein`, `fat`, `carbs`, `water`, `weight`, `favorite`, `warning`, `success`, `error`
- `calories` (intake) and `burned` (exercise) share a warm orange family but remain visually distinct
- `error` is reserved for destructive actions (delete), never for representing burned calories
- **`tint(color, opacity)`** — utility for transparent backgrounds instead of hand-rolled `rgba()`
- **WCAG AA** contrast on both themes; dark mode uses Material 300–400 shades
- **`ALPHA_HEX` constants** for standard opacity levels

## Project structure

```
src/
  constants/
    theme.ts            — light theme, semantic colors, spacing, fonts, ALPHA_HEX
    darkTheme.ts        — dark theme (WCAG AA contrast)
    nutrition.ts        — activity coefficients, goals, daily micronutrient targets
    exercises.ts        — exercise types, MET coefficients
  types/
    index.ts            — TypeScript interfaces (FoodItem, MealEntry, Recipe, RecipeIngredient, ...)
  utils/
    nutrition.ts        — BMR (Mifflin-St Jeor) and daily macro targets
  services/
    aiNutrition.ts      — AI text/photo food analysis (Vercel proxy)
    openfoodfacts.ts    — Open Food Facts API (barcodes)
    feedback.ts         — feedback delivery via Resend
    supabase.ts         — placeholder for future Supabase integration
  hooks/
    useProfile.ts       — user profile (age, weight, height, sex, goal)
    useMeals.ts         — meal CRUD, daily summary (todaySummary)
    useExercises.ts     — exercise CRUD with MET calculation
    useWater.ts         — water tracker with undo
    useWeight.ts        — weight history
    useTheme.ts         — theme switching + tint() utility
    useFoods.ts         — recent / favorite foods (max 30)
    useRecipes.ts       — recipes, computeRecipeNutrition, computeRecipeTotalWeight, recipeServingGrams
    useStreak.ts        — streak system (current / best logging streak)
    useNotifications.ts — reminders (graceful degradation in Expo Go)
    useDebounce.ts      — debounced search
  i18n/
    index.ts            — localization mechanism
    ru.ts, en.ts, pl.ts — translations (300+ keys per language)
  components/
    SplashScreen.tsx       — animated launch screen
    AIThinkingAnimation    — AI loading animation
    CalorieSummaryCard     — calorie widget with animated ring
    MiniRing.tsx           — compact macro ring (adaptive width, numberOfLines)
    MealCard.tsx           — food card (calorie-first design, swipe-to-delete)
    MealActionModal.tsx    — animated action sheet (edit / delete)
    ExerciseCard.tsx       — exercise card (burned color)
    WaterWidget.tsx        — water tracker (SVG human silhouette, red → yellow → green gradient)
    StreakWidget.tsx       — streak widget
    ProgressRing.tsx       — reusable progress ring
    MacroBar.tsx           — horizontal macro bar with daily-target context
    CustomAlert.tsx        — custom modal alert
    ErrorBoundary.tsx      — error handling
    SkeletonDashboard      — loading skeleton
    Logo.tsx               — SVG logo (3 variants)
  screens/
    DashboardScreen        — home (rings, water, streak, exercises)
    AddMealScreen          — AI chat + photo input, mini-nutrient block after adding
    ConfirmMealScreen      — portion confirmation with daily-target context
    BarcodeScannerScreen   — barcode scanner
    AddCustomFoodScreen    — manual entry of 8 nutrients
    AddExerciseScreen      — 10 exercise types with MET
    HistoryScreen          — daily history with copy-to-today
    AnalyticsScreen        — calorie / macro / weight charts, JSON export-import
    ProfileScreen          — profile, settings, theme, language, notifications
    RecipesScreen          — recipe list
    AddRecipeScreen        — recipe builder with AI ingredient recognition
    FeedbackScreen         — feedback form to the developer
    OnboardingScreen       — first-launch onboarding (3 steps)
  navigation/
    RootNavigator.tsx      — Tab (3 tabs) + Stack (10 modal screens)
  widgets/
    CaloriesWidget.tsx     — Android home-screen widget
    widgetTaskHandler.tsx  — widget task handler
```

## Features

### 🤖 AI food analysis
- Text description → calories, macros, benefits, confidence level
- Food photo → recognition and analysis (Llama 4 Scout Vision)
- Combined input: photo + text description
- Edit grams before adding
- Mini nutrient block after adding (calories, P/F/C bars)
- 10 requests/day cap, automatic meal type by time of day (`getMealTypeByTime`)

### 📊 Dashboard
- Animated calorie ring (consumed / burned / remaining)
- 3 mini macro rings (adaptive width, long-text truncation)
- Collapsible micronutrients (fiber, sugar, saturated fat, salt)
- Water tracker — SVG human silhouette with clipped fill (red → yellow → green gradient)
- Streak widget (visual indicator at 3+ / 7+ days)
- Meal cards with calorie-first design (large orange number, macros secondary)
- Animated action sheet on long-press
- Exercises shown in `burned` color (not `error`)
- Pull-to-refresh, staggered fade-in animations

### 🍳 Recipes
- Compound dishes from multiple ingredients
- AI ingredient recognition: describe in words (e.g. "200 g chicken breast"), AI determines macros
- Total recipe macro calculation (per-100g normalization for correct portioning)
- Recipe = whole dish (no servings split)
- Localized macro abbreviations (Б/Ж/У, P/F/C, B/T/W)

### 👤 Profile
- Metrics: age, weight, height, water goal (dashed border, tap-to-edit)
- Sex, activity level (icons), goal (cut / maintain / bulk)
- Live recalculation of daily targets
- Theme, language, notifications (collapsible)
- Feedback button

### 📅 History & analytics
- Day grouping, swipe-to-delete, copy day to today
- Calorie charts (week / month), macro pie chart
- Weight tracking with chart (`weight` color), JSON export / import

### 🏋️ Exercises
- 10 types with MET calculation (walk, run, bike, swim, gym, yoga, HIIT, dance, stretch, other)
- Swipe-to-delete, haptic feedback
- Burned calories shown in `burned` color

### 📷 Barcode + manual entry
- Scanner via expo-camera → Open Food Facts lookup
- Manual entry for all 8 nutrients

### 💧 Water tracker
- SVG human silhouette with clipped fill
- Color gradient by level: red (0%) → yellow (50%) → green (100%)
- Quick-add buttons (150 / 250 / 500 ml)
- 20% minimum fill for visual feedback
- Undo button

### 💬 Feedback
- Form: name (optional), reply-to email (optional), message
- Delivered via Resend API to the developer's inbox

### 🎨 Other
- Animated splash screen with the logo
- Light / dark theme with semantic color system
- 3 languages: Russian, English, Polish (300+ keys)
- Notifications (development build): meals, water, daily summary
- First-launch onboarding
- `tint()` utility for consistent transparencies
- ErrorBoundary for resilience
- Android home-screen widget (calories remaining)

## Getting started

```bash
# Install dependencies
npm install

# Run the dev server
npx expo start

# With cache cleared
npx expo start -c

# LAN mode (phone and PC on the same network)
npx expo start --lan
```

## Building an APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Sign in
eas login

# Configure the project
eas build:configure

# Build an APK (Android)
eas build --platform android --profile preview
```

## Environment variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_AI_PROXY_URL` | URL of your own Vercel proxy (e.g. `https://your-proxy.vercel.app/api/ai-nutrition`). AI features stay disabled until set. |
| `EXPO_PUBLIC_APP_SECRET` | Shared secret for authenticating requests (must match the proxy's `APP_SECRET`). Optional. |

> **Note:** the AI proxy is not bundled with this repo — you need to deploy your own (small Vercel/Node server that calls Groq + Resend). The client gracefully disables AI features when `EXPO_PUBLIC_AI_PROXY_URL` is empty.

### Server variables (Vercel Dashboard → CaloraAI)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for AI analysis |
| `APP_SECRET` | Shared secret (matches the client value) |
| `RESEND_API_KEY` | Resend API key for delivering feedback emails |

## License

[MIT](LICENSE) © DarkBeer0
