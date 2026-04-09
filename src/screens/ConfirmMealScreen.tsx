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
import MacroBar from '../components/MacroBar';
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

export default function ConfirmMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { food, editMeal, initialGrams } = route.params;
  const { addMeal, updateMeal, todaySummary } = useMeals();
  const { addRecent, toggleFavorite, isFavorite } = useFoods();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { t } = useI18n();

  const isEditing = !!editMeal;
  const [grams, setGrams] = useState(
    isEditing ? String(editMeal.grams) : initialGrams ? String(Math.round(initialGrams)) : '100'
  );
  const mealType = isEditing ? editMeal.mealType : getMealTypeByTime();

  const gramsNum = parseFloat(grams) || 0;
  const nutrition = calculateNutrition(food, gramsNum);
  const foodIsFavorite = isFavorite(food.id);

  // Daily targets
  const target = calculateDailyTarget(profile);

  // Already consumed today (subtract the editing meal if in edit mode)
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

  // Calorie summary
  const totalCaloriesAfter = consumed.calories + nutrition.calories;
  const calorieOver = totalCaloriesAfter > target.calories;
  const calorieProgress = target.calories > 0 ? Math.min(totalCaloriesAfter / target.calories, 1) : 0;
  const consumedCaloriePct = target.calories > 0 ? Math.min(consumed.calories / target.calories, 1) : 0;

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {/* Food name + favorite */}
      <View style={styles.foodHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
          <Text style={[styles.foodSub, { color: colors.textSecondary }]}>{food.caloriesPer100g} {t('add_meal_per100g')}</Text>
        </View>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.favBtn}>
          <Ionicons
            name={foodIsFavorite ? 'star' : 'star-outline'}
            size={28}
            color={foodIsFavorite ? colors.favorite : colors.border}
          />
        </TouchableOpacity>
      </View>

      {/* Grams input */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('confirm_portion')}</Text>
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

      {/* Quick grams */}
      <View style={styles.quickRow}>
        {[50, 100, 150, 200, 300].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }, grams === String(g) && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setGrams(String(g))}
          >
            <Text style={[styles.quickBtnText, { color: colors.text }, grams === String(g) && styles.quickBtnTextActive]}>
              {g}{t('g')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nutrition preview — relative to daily targets */}
      <View style={[styles.nutritionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Inline calorie row */}
        <View style={styles.calorieInlineRow}>
          <Text style={[styles.calorieInlineLabel, { color: colors.text }]}>{t('confirm_total')}</Text>
          <Text style={[styles.calorieInlineValue, { color: calorieOver ? colors.error : colors.calories }]}>
            +{nutrition.calories} {t('kcal')}
          </Text>
        </View>
        <Text style={[styles.calorieInlineSub, { color: colors.textSecondary }]}>
          {Math.round(totalCaloriesAfter)} / {target.calories} {t('kcal')}
        </Text>
        <View style={[styles.calorieBarBg, { backgroundColor: `${colors.calories}20` }]}>
          <View style={[styles.calorieBarConsumed, { width: `${consumedCaloriePct * 100}%`, backgroundColor: colors.calories, opacity: 0.25 }]} />
          <View style={[styles.calorieBarNew, { left: `${consumedCaloriePct * 100}%`, width: `${(calorieProgress - consumedCaloriePct) * 100}%`, backgroundColor: calorieOver ? colors.error : colors.calories }]} />
        </View>

        <View style={[styles.microDivider, { backgroundColor: colors.border, marginTop: SPACING.md }]} />

        <MacroBar label={t('dash_protein')} current={nutrition.protein} target={target.protein} color={colors.protein} alreadyConsumed={consumed.protein} />
        <MacroBar label={t('dash_fat')} current={nutrition.fat} target={target.fat} color={colors.fat} alreadyConsumed={consumed.fat} />
        <MacroBar label={t('dash_carbs')} current={nutrition.carbs} target={target.carbs} color={colors.carbs} alreadyConsumed={consumed.carbs} />

        <View style={[styles.microDivider, { backgroundColor: colors.border }]} />
        <MacroBar label={t('dash_fiber')} current={nutrition.fiber} target={DAILY_MICRO_TARGETS.fiber} color={colors.fiber} alreadyConsumed={consumed.fiber} />
        <MacroBar label={t('dash_sugars')} current={nutrition.sugars} target={DAILY_MICRO_TARGETS.sugars} color={colors.sugars} alreadyConsumed={consumed.sugars} />
        <MacroBar label={t('dash_sat_fat')} current={nutrition.saturatedFat} target={DAILY_MICRO_TARGETS.saturatedFat} color={colors.saturatedFat} alreadyConsumed={consumed.saturatedFat} />
        <MacroBar label={t('dash_salt')} current={nutrition.salt} target={DAILY_MICRO_TARGETS.salt} color={colors.salt} alreadyConsumed={consumed.salt} />
      </View>

      {/* Confirm button */}
      <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm} activeOpacity={0.8}>
        <Text style={styles.confirmBtnText}>{isEditing ? t('confirm_update') : t('confirm_add')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingBottom: 40 },
  foodHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg },
  foodName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold' },
  foodSub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  favBtn: { padding: SPACING.xs, marginLeft: SPACING.sm },
  sectionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.sm },
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
  quickBtnTextActive: { color: '#fff', fontWeight: '700' },

  // Calorie inline
  calorieInlineRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 2,
  },
  calorieInlineLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  calorieInlineValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  calorieInlineSub: { fontSize: FONT_SIZE.xs, marginBottom: 4, textAlign: 'right' },
  calorieBarBg: {
    width: '100%', height: 6, borderRadius: 3,
    overflow: 'hidden',
  },
  calorieBarConsumed: {
    position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
  },
  calorieBarNew: {
    position: 'absolute', top: 0, height: '100%', borderRadius: 3,
  },

  nutritionCard: { borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1 },
  microDivider: { height: 1, marginVertical: SPACING.sm },
  confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
