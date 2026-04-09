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
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { calculateNutrition } from '../utils/nutrition';
import { useMeals } from '../hooks/useMeals';
import { useFoods } from '../hooks/useFoods';
import MacroBar from '../components/MacroBar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MealEntry } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ConfirmMeal'>;

const MEAL_TYPE_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_I18N: Record<string, string> = {
  breakfast: 'meal_breakfast',
  lunch: 'meal_lunch',
  dinner: 'meal_dinner',
  snack: 'meal_snack',
};

export default function ConfirmMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { food, editMeal, initialGrams } = route.params;
  const { addMeal, updateMeal } = useMeals();
  const { addRecent, toggleFavorite, isFavorite } = useFoods();
  const { colors } = useTheme();
  const { t } = useI18n();

  const isEditing = !!editMeal;
  const [grams, setGrams] = useState(
    isEditing ? String(editMeal.grams) : initialGrams ? String(Math.round(initialGrams)) : '100'
  );
  const [mealType, setMealType] = useState<typeof MEAL_TYPE_KEYS[number]>(
    isEditing ? editMeal.mealType : 'lunch'
  );

  const gramsNum = parseFloat(grams) || 0;
  const nutrition = calculateNutrition(food, gramsNum);
  const foodIsFavorite = isFavorite(food.id);

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
            color={foodIsFavorite ? '#FFB300' : colors.border}
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

      {/* Nutrition preview */}
      <View style={[styles.nutritionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.nutritionTitle, { color: colors.text }]}>
          {t('confirm_total')} <Text style={{ color: colors.calories, fontWeight: '700' }}>{nutrition.calories} {t('kcal')}</Text>
        </Text>
        <MacroBar label={t('dash_protein')} current={nutrition.protein} target={nutrition.protein} color={colors.protein} />
        <MacroBar label={t('dash_fat')} current={nutrition.fat} target={nutrition.fat} color={colors.fat} />
        <MacroBar label={t('dash_carbs')} current={nutrition.carbs} target={nutrition.carbs} color={colors.carbs} />

        <View style={[styles.microDivider, { backgroundColor: colors.border }]} />
        <MacroBar label={t('dash_fiber')} current={nutrition.fiber} target={nutrition.fiber} color={colors.fiber} />
        <MacroBar label={t('dash_sugars')} current={nutrition.sugars} target={nutrition.sugars} color={colors.sugars} />
        <MacroBar label={t('dash_sat_fat')} current={nutrition.saturatedFat} target={nutrition.saturatedFat} color={colors.saturatedFat} />
        <MacroBar label={t('dash_salt')} current={nutrition.salt} target={nutrition.salt} color={colors.salt} />
      </View>

      {/* Meal type selector */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('confirm_meal_type')}</Text>
      <View style={styles.mealTypeRow}>
        {MEAL_TYPE_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.mealTypeBtn, { backgroundColor: colors.surface, borderColor: colors.border }, mealType === key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setMealType(key)}
          >
            <Text style={[styles.mealTypeText, { color: colors.text }, mealType === key && styles.mealTypeTextActive]}>
              {t(MEAL_I18N[key] as any)}
            </Text>
          </TouchableOpacity>
        ))}
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
  nutritionCard: { borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1 },
  nutritionTitle: { fontSize: FONT_SIZE.md, marginBottom: SPACING.md, textAlign: 'center' },
  microDivider: { height: 1, marginVertical: SPACING.sm },
  mealTypeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, flexWrap: 'wrap' },
  mealTypeBtn: {
    flex: 1, minWidth: '40%', paddingVertical: SPACING.sm,
    borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  mealTypeText: { fontSize: FONT_SIZE.sm },
  mealTypeTextActive: { color: '#fff', fontWeight: '600' },
  confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
