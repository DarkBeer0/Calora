# 🔥 Calora

Мобильное приложение для подсчёта калорий с AI-анализом еды, отслеживанием КБЖУ, микронутриентов и тренировок.

<p align="center">
  <img src="assets/icon.png" width="120" alt="Calora Icon" />
</p>

## Описание

Calora помогает контролировать питание: вести дневник приёмов пищи, рассчитывать дневную норму КБЖУ на основе персональных параметров, отслеживать микронутриенты и учитывать сожжённые калории от упражнений.

**Ключевые особенности:**
- 🤖 **AI-чат** — опишите блюдо словами или отправьте фото, AI рассчитает КБЖУ
- 📊 **Полный трекинг** — калории, БЖУ, микронутриенты, вода, упражнения
- 📱 **Offline-first** — все данные хранятся на устройстве, без регистрации
- 🌙 **Тёмная тема** + 3 языка (RU / EN / PL)

## Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Фреймворк** | React Native 0.81 + Expo SDK 54, TypeScript |
| **Навигация** | React Navigation (Tab + Stack) |
| **Хранилище** | AsyncStorage (offline-first) |
| **AI** | Groq API (Llama 3.3 70B текст + Llama 4 Scout Vision) через Vercel-прокси |
| **UI** | react-native-svg, react-native-chart-kit, expo-haptics |
| **Камера** | expo-camera (штрих-коды), expo-image-picker (фото еды) |
| **Уведомления** | expo-notifications (development build) |
| **Email** | Resend API (обратная связь) |

## Архитектура

```
┌──────────────┐                              ┌──────────────────┐
│  Mobile App  │  POST /api/ai-nutrition       │  Vercel Proxy    │     Groq API
│  (Expo)      │ ────────────────────────────> │  (CaloraAI)      │ ──────────────> Llama 3.3 / 4 Scout
│              │ <──────────────────────────── │                  │ <──────────────
│              │  { analysis: {...} }          │  POST /api/feedback          │
│              │ ────────────────────────────> │  ───────────────────> Resend ──> email
└──────────────┘                              └──────────────────┘
```

- API-ключи хранятся **только на сервере** (Vercel env)
- Rate limiting: 20 req/min (AI), 3 req/min (feedback)
- Клиент: лимит 10 AI-запросов/день на устройство
- Фото: base64 до ~5MB, vision модель для распознавания еды
- Обратная связь: Resend → email разработчику

## Структура проекта

```
src/
  constants/
    theme.ts            — цвета (светлая тема), отступы, шрифты
    darkTheme.ts        — цвета тёмной темы
    nutrition.ts        — коэффициенты активности, цели, дневные нормы
    exercises.ts        — типы упражнений, MET-коэффициенты
  types/
    index.ts            — TypeScript-интерфейсы
  utils/
    nutrition.ts        — расчёт BMR (Mifflin-St Jeor), дневной нормы КБЖУ
  services/
    aiNutrition.ts      — AI-анализ текста и фото еды (Vercel proxy)
    openfoodfacts.ts    — Open Food Facts API (штрих-коды, поиск)
    feedback.ts         — отправка обратной связи через Resend
  hooks/
    useProfile.ts       — профиль пользователя (возраст, вес, рост, пол, цель)
    useMeals.ts         — CRUD приёмов пищи, дневная сводка
    useExercises.ts     — CRUD упражнений с MET-расчётом
    useWater.ts         — трекер воды с undo
    useWeight.ts        — история веса
    useTheme.ts         — переключение светлая/тёмная тема
    useFoods.ts         — недавние/избранные продукты (макс. 30)
    useRecipes.ts       — рецепты (составные блюда)
    useNotifications.ts — напоминания (graceful degradation в Expo Go)
    useDebounce.ts      — дебаунс для поиска
  i18n/
    ru.ts, en.ts, pl.ts — мультиязычность (290+ ключей)
  components/
    SplashScreen.tsx    — анимированный экран загрузки
    AIThinkingAnimation — анимация ожидания AI-ответа
    CalorieSummaryCard  — виджет калорий с анимированным кольцом
    MiniRing.tsx        — компактное кольцо БЖУ
    MealCard.tsx        — карточка продукта (swipe-to-delete)
    ExerciseCard.tsx    — карточка упражнения
    WaterWidget.tsx     — трекер воды (SVG силуэт с заполнением)
    ProgressRing.tsx    — переиспользуемое кольцо прогресса
    MacroBar.tsx        — горизонтальный бар макросов
    ErrorBoundary.tsx   — обработка ошибок
    SkeletonDashboard   — скелетон загрузки
    Logo.tsx            — SVG-логотип (3 варианта)
  screens/
    DashboardScreen     — главный экран (кольца, вода, упражнения)
    AddMealScreen       — AI-чат + фото для добавления еды
    ConfirmMealScreen   — подтверждение порции и типа приёма пищи
    BarcodeScannerScreen — сканер штрих-кодов
    AddCustomFoodScreen — ручной ввод 8 нутриентов
    AddExerciseScreen   — 10 типов упражнений с MET
    HistoryScreen       — история по дням с копированием
    AnalyticsScreen     — графики калорий, макросы, вес, экспорт/импорт
    ProfileScreen       — профиль, настройки, тема, язык, уведомления
    RecipesScreen       — список рецептов
    AddRecipeScreen     — создание рецепта с AI-ингредиентами
    FeedbackScreen      — обратная связь разработчику
    OnboardingScreen    — онбординг (3 шага)
  navigation/
    RootNavigator.tsx   — Tab (3 вкладки) + Stack (9 модальных экранов)
```

## Функции

### 🤖 AI-анализ еды
- Описание блюда текстом → КБЖУ + польза + уровень уверенности
- Фото еды → распознавание и анализ (Llama 4 Scout Vision)
- Комбинация: фото + текстовое описание
- Редактирование граммов перед добавлением
- Лимит 10 запросов/день, автовыбор типа приёма по времени

### 📊 Дашборд
- Анимированное кольцо калорий (потреблено / сожжено / осталось)
- 3 мини-кольца БЖУ
- Сворачиваемые микронутриенты (клетчатка, сахар, насыщ. жиры, соль)
- Трекер воды с визуальным заполнением
- Упражнения (отображаются при наличии)
- Pull-to-refresh, staggered fade-in анимации

### 👤 Профиль
- Метрики: возраст, вес, рост, цель воды (dashed border, tap-to-edit)
- Пол, уровень активности (иконки), цель (похудение/поддержание/набор)
- Живой пересчёт дневной нормы КБЖУ
- Тема, язык, уведомления (сворачиваемые)
- Кнопка обратной связи

### 📅 История и аналитика
- Группировка по дням, swipe-to-delete, копирование дня на сегодня
- Графики калорий (неделя/месяц), pie chart макросов
- Трекинг веса с графиком, экспорт/импорт JSON

### 🏋️ Упражнения
- 10 типов с MET-расчётом (ходьба, бег, велосипед, плавание, зал, йога, HIIT, танцы, растяжка, другое)
- Swipe-to-delete, haptic feedback

### 📷 Штрих-код + ручной ввод
- Сканер через expo-camera → поиск в Open Food Facts
- Ручной ввод всех 8 нутриентов

### 🍳 Рецепты
- Составные блюда из нескольких ингредиентов (AI или поиск)
- Расчёт КБЖУ на порцию

### 💬 Обратная связь
- Форма: имя (опц.), email для ответа (опц.), сообщение
- Отправка через Resend API на email разработчика

### 🎨 Прочее
- Анимированный сплэш-экран с логотипом
- Тёмная/светлая тема
- 3 языка: русский, английский, польский
- Уведомления (development build): еда, вода, итоги дня
- Онбординг при первом запуске
- ErrorBoundary для устойчивости

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npx expo start

# С очисткой кэша
npx expo start -c

# LAN-режим (телефон и ПК в одной сети)
npx expo start --lan
```

## Сборка APK

```bash
# Установить EAS CLI
npm install -g eas-cli

# Авторизоваться
eas login

# Настроить проект
eas build:configure

# Собрать APK (Android)
eas build --platform android --profile preview
```

## Переменные окружения

```bash
cp .env.example .env
```

| Переменная | Описание |
|-----------|----------|
| `EXPO_PUBLIC_AI_PROXY_URL` | URL Vercel-прокси (по умолчанию встроен) |
| `EXPO_PUBLIC_APP_SECRET` | Shared secret для аутентификации запросов |

### Серверные переменные (Vercel Dashboard → CaloraAI)

| Переменная | Описание |
|-----------|----------|
| `GROQ_API_KEY` | Ключ Groq API для AI-анализа |
| `APP_SECRET` | Shared secret (совпадает с клиентским) |
| `RESEND_API_KEY` | Ключ Resend для отправки email обратной связи |

## Лицензия

Private project.
