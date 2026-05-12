import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { DAILY_MICRO_TARGETS } from '../constants/nutrition';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { calculateNutrition, calculateDailyTarget } from '../utils/nutrition';
import { useMeals } from '../hooks/useMeals';
import { useFoods } from '../hooks/useFoods';
import { useProfile } from '../hooks/useProfile';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MealEntry } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ConfirmMeal'>;

function getMealTypeByTime(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 19) return 'dinner';
  return 'snack';
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export default function ConfirmMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { food, editMeal, initialGrams } = route.params;
  const { addMeal, updateMeal, todaySummary } = useMeals();
  const { addRecent, toggleFavorite, isFavorite } = useFoods();
  const { profile } = useProfile();
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const isEditing = !!editMeal;
  const [grams, setGrams] = useState(
    isEditing ? String(editMeal.grams) : initialGrams ? String(Math.round(initialGrams)) : '100'
  );
  const [microExpanded, setMicroExpanded] = useState(false);
  const mealType = isEditing ? editMeal.mealType : getMealTypeByTime();

  const gramsNum = parseFloat(grams) || 0;
  const nutrition = calculateNutrition(food, gramsNum);
  const foodIsFavorite = isFavorite(food.id);
  const target = calculateDailyTarget(profile);

  const consumed = {
    calories: todaySummary.totalCalories - (isEditing ? editMeal.calories : 0),
    protein: todaySummary.totalProtein - (isEditing ? editMeal.protein : 0),
    fat: todaySummary.totalFat - (isEditing ? editMeal.fat : 0),
    carbs: todaySummary.totalCarbs - (isEditing ? editMeal.carbs : 0),
    fiber: todaySummary.totalFiber - (isEditing ? (editMeal.fiber ?? 0) : 0),
    sugars: todaySummary.totalSugars - (isEditing ? (editMeal.sugars ?? 0) : 0),
    saturatedFat: todaySummary.totalSaturatedFat - (isEditing ? (editMeal.saturatedFat ?? 0) : 0),
    salt: todaySummary.totalSalt - (isEditing ? (editMeal.salt ?? 0) : 0),
  };

  const handleConfirm = async () => {
    if (gramsNum <= 0) {
      Alert.alert(t('error'), t('confirm_error_grams'));
      return;
    }

    const entry: MealEntry = {
      id: isEditing ? editMeal.id : Date.now().toString(),
      userId: '1',
      date: isEditing ? editMeal.date : new Date().toISOString().slice(0, 10),
      mealType,
      foodItem: food,
      grams: gramsNum,
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carbs: nutrition.carbs,
      fiber: nutrition.fiber,
      sugars: nutrition.sugars,
      saturatedFat: nutrition.saturatedFat,
      salt: nutrition.salt,
      createdAt: isEditing ? editMeal.createdAt : new Date().toISOString(),
    };

    if (isEditing) {
      await updateMeal(entry);
    } else {
      await addMeal(entry);
      await addRecent(food);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.popToTop();
  };

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(food);
  };

  // Calorie hero numbers
  const totalCaloriesAfter = consumed.calories + nutrition.calories;
  const calorieOver = totalCaloriesAfter > target.calories;
  const calorieProgress = target.calories > 0 ? Math.min(totalCaloriesAfter / target.calories, 1) : 0;
  const consumedCaloriePct = target.calories > 0 ? Math.min(consumed.calories / target.calories, 1) : 0;
  const caloriePctOfTarget = target.calories > 0 ? Math.round((nutrition.calories / target.calories) * 100) : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Food header + favorite */}
        <View style={styles.foodHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{food.name}</Text>
            <Text style={[styles.foodSub, { color: colors.textSecondary }]}>{food.caloriesPer100g} {t('add_meal_per100g')}</Text>
          </View>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={foodIsFavorite ? 'star' : 'star-outline'}
              size={28}
              color={foodIsFavorite ? colors.favorite : colors.border}
            />
          </TouchableOpacity>
        </View>

        {/* Portion input */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('confirm_portion')}</Text>
        <View style={[styles.gramsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.gramsInput, { color: colors.text }]}
            value={grams}
            onChangeText={setGrams}
            keyboardType="numeric"
            maxLength={6}
            selectTextOnFocus
          />
          <Text style={[styles.gramsSuffix, { color: colors.textSecondary }]}>{t('g')}</Text>
        </View>

        <View style={styles.quickRow}>
          {[50, 100, 150, 200, 300].map((g) => {
            const active = grams === String(g);
            return (
              <TouchableOpacity
                key={g}
                style={[
                  styles.quickBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  active && { backgroundColor: tint(colors.primary, 0.15), borderColor: colors.primary },
                ]}
                onPress={() => setGrams(String(g))}
              >
                <Text style={[
                  styles.quickBtnText,
                  { color: colors.text },
                  active && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {g}{t('g')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* HERO: calorie card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{t('confirm_total')}</Text>
            <Text style={[styles.heroPct, { color: colors.textSecondary }]}>{caloriePctOfTarget}%</Text>
          </View>
          <Text style={[styles.heroValue, { color: calorieOver ? colors.error : colors.calories }]}>
            +{nutrition.calories} <Text style={[styles.heroUnit, { color: calorieOver ? colors.error : colors.calories }]}>{t('kcal')}</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {Math.round(totalCaloriesAfter)} / {target.calories} {t('kcal')}
          </Text>
          <View style={[styles.calorieBarBg, { backgroundColor: tint(colors.calories, 0.12) }]}>
            <View style={[styles.calorieBarConsumed, { width: `${consumedCaloriePct * 100}%`, backgroundColor: colors.calories, opacity: 0.3 }]} />
            <View style={[styles.calorieBarNew, { left: `${consumedCaloriePct * 100}%`, width: `${(calorieProgress - consumedCaloriePct) * 100}%`, backgroundColor: calorieOver ? colors.error : colors.calories }]} />
          </View>
        </View>

        {/* Macros: 3 chips */}
        <View style={styles.macroRow}>
          <MacroChip
            label={t('dash_protein')}
            delta={r1(nutrition.protein)}
            consumed={consumed.protein}
            target={target.protein}
            color={colors.protein}
            tint={tint}
            colors={colors}
          />
          <MacroChip
            label={t('dash_fat')}
            delta={r1(nutrition.fat)}
            consumed={consumed.fat}
            target={target.fat}
            color={colors.fat}
            tint={tint}
            colors={colors}
          />
          <MacroChip
            label={t('dash_carbs')}
            delta={r1(nutrition.carbs)}
            consumed={consumed.carbs}
            target={target.carbs}
            color={colors.carbs}
            tint={tint}
            colors={colors}
          />
        </View>

        {/* Micronutrients — collapsible */}
        <TouchableOpacity
          style={[styles.microToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setMicroExpanded(!microExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.microToggleLabel, { color: colors.text }]}>{t('dash_extra')}</Text>
          <Ionicons name={microExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {microExpanded && (
          <View style={[styles.microCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MicroRow label={t('dash_fiber')} delta={r1(nutrition.fiber)} consumed={consumed.fiber} target={DAILY_MICRO_TARGETS.fiber} color={colors.fiber} good colors={colors} tint={tint} />
            <MicroRow label={t('dash_sugars')} delta={r1(nutrition.sugars)} consumed={consumed.sugars} target={DAILY_MICRO_TARGETS.sugars} color={colors.sugars} colors={colors} tint={tint} />
            <MicroRow label={t('dash_sat_fat')} delta={r1(nutrition.saturatedFat)} consumed={consumed.saturatedFat} target={DAILY_MICRO_TARGETS.saturatedFat} color={colors.saturatedFat} colors={colors} tint={tint} />
            <MicroRow label={t('dash_salt')} delta={r1(nutrition.salt)} consumed={consumed.salt} target={DAILY_MICRO_TARGETS.salt} color={colors.salt} colors={colors} tint={tint} last />
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaWrap,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom + SPACING.sm, SPACING.lg),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>{isEditing ? t('confirm_update') : t('confirm_add')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---- Macro chip (P/F/C) ---- */

function MacroChip({
  label, delta, consumed, target, color, tint, colors,
}: {
  label: string;
  delta: number;
  consumed: number;
  target: number;
  color: string;
  tint: (hex: string, opacity: number) => string;
  colors: { textSecondary: string; error: string };
}) {
  const totalAfter = consumed + delta;
  const isOver = target > 0 && totalAfter > target;
  const progressAfter = target > 0 ? Math.min(totalAfter / target, 1) : 0;
  const progressConsumed = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={[chipS.chip, { backgroundColor: tint(color, 0.08) }]}>
      <Text style={[chipS.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[chipS.delta, { color: isOver ? colors.error : color }]}>
        +{delta}
        <Text style={[chipS.deltaUnit, { color: isOver ? colors.error : color }]}>g</Text>
      </Text>
      <View style={[chipS.barBg, { backgroundColor: tint(color, 0.15) }]}>
        <View style={[chipS.barConsumed, { width: `${progressConsumed * 100}%`, backgroundColor: color, opacity: 0.3 }]} />
        <View style={[chipS.barNew, { left: `${progressConsumed * 100}%`, width: `${(progressAfter - progressConsumed) * 100}%`, backgroundColor: isOver ? colors.error : color }]} />
      </View>
    </View>
  );
}

/* ---- Micro row ---- */

function MicroRow({
  label, delta, consumed, target, color, good, last, colors, tint,
}: {
  label: string;
  delta: number;
  consumed: number;
  target: number;
  color: string;
  good?: boolean;
  last?: boolean;
  colors: { text: string; textSecondary: string; error: string };
  tint: (hex: string, opacity: number) => string;
}) {
  const totalAfter = consumed + delta;
  const isOver = !good && target > 0 && totalAfter > target;
  const progressAfter = target > 0 ? Math.min(totalAfter / target, 1) : 0;
  const progressConsumed = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={[microS.row, last && { marginBottom: 0 }]}>
      <View style={microS.header}>
        <Text style={[microS.label, { color: colors.text }]}>{label}</Text>
        <Text style={[microS.value, { color: isOver ? colors.error : colors.textSecondary }]}>
          +{delta}g
        </Text>
      </View>
      <View style={[microS.barBg, { backgroundColor: tint(color, 0.15) }]}>
        <View style={[microS.barConsumed, { width: `${progressConsumed * 100}%`, backgroundColor: color, opacity: 0.3 }]} />
        <View style={[microS.barNew, { left: `${progressConsumed * 100}%`, width: `${(progressAfter - progressConsumed) * 100}%`, backgroundColor: isOver ? colors.error : color }]} />
      </View>
    </View>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: SPACING.lg },

  foodHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg },
  foodName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', lineHeight: 30 },
  foodSub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  favBtn: { padding: SPACING.xs, marginLeft: SPACING.sm },

  sectionLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  gramsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm,
  },
  gramsInput: { flex: 1, fontSize: FONT_SIZE.xxl, fontWeight: '700', paddingVertical: SPACING.sm },
  gramsSuffix: { fontSize: FONT_SIZE.lg },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  quickBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },

  // Hero
  heroCard: {
    borderRadius: 20, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  heroLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroPct: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  heroValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  heroUnit: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  heroSub: { fontSize: FONT_SIZE.xs, marginTop: 2, marginBottom: SPACING.sm },
  calorieBarBg: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  calorieBarConsumed: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4 },
  calorieBarNew: { position: 'absolute', top: 0, height: '100%', borderRadius: 4 },

  // Macro row
  macroRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  // Micro
  microToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: SPACING.md,
  },
  microToggleLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  microCard: {
    borderRadius: 14, borderWidth: 1, padding: SPACING.md, marginTop: SPACING.sm,
  },

  // CTA
  ctaWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});

const chipS = StyleSheet.create({
  chip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 78,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  delta: {
    fontSize: 20, fontWeight: '800', marginTop: 2, letterSpacing: -0.5,
  },
  deltaUnit: {
    fontSize: 12, fontWeight: '700',
  },
  barBg: {
    width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: SPACING.xs,
  },
  barConsumed: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2 },
  barNew: { position: 'absolute', top: 0, height: '100%', borderRadius: 2 },
});

const microS = StyleSheet.create({
  row: { marginBottom: SPACING.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  value: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  barBg: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  barConsumed: { position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3 },
  barNew: { position: 'absolute', top: 0, height: '100%', borderRadius: 3 },
});
