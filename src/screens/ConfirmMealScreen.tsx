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
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import { MEAL_LABELS } from '../constants/nutrition';
import { calculateNutrition } from '../utils/nutrition';
import { useMeals } from '../hooks/useMeals';
import MacroBar from '../components/MacroBar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MealEntry } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ConfirmMeal'>;

const MEAL_TYPE_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function ConfirmMealScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { food } = route.params;
  const { addMeal } = useMeals();

  const [grams, setGrams] = useState('100');
  const [mealType, setMealType] = useState<typeof MEAL_TYPE_KEYS[number]>('lunch');

  const gramsNum = parseFloat(grams) || 0;
  const nutrition = calculateNutrition(food, gramsNum);

  const handleConfirm = async () => {
    if (gramsNum <= 0) {
      Alert.alert('Ошибка', 'Укажите граммовку');
      return;
    }

    const entry: MealEntry = {
      id: Date.now().toString(),
      userId: '1',
      date: new Date().toISOString().slice(0, 10),
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
      createdAt: new Date().toISOString(),
    };

    await addMeal(entry);
    navigation.popToTop();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Food name */}
      <Text style={styles.foodName}>{food.name}</Text>
      <Text style={styles.foodSub}>{food.caloriesPer100g} ккал / 100г</Text>

      {/* Grams input */}
      <Text style={styles.sectionLabel}>Порция</Text>
      <View style={styles.gramsRow}>
        <TextInput
          style={styles.gramsInput}
          value={grams}
          onChangeText={setGrams}
          keyboardType="numeric"
          maxLength={6}
          selectTextOnFocus
        />
        <Text style={styles.gramsSuffix}>г</Text>
      </View>

      {/* Quick grams */}
      <View style={styles.quickRow}>
        {[50, 100, 150, 200, 300].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.quickBtn, grams === String(g) && styles.quickBtnActive]}
            onPress={() => setGrams(String(g))}
          >
            <Text style={[styles.quickBtnText, grams === String(g) && styles.quickBtnTextActive]}>
              {g}г
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nutrition preview */}
      <View style={styles.nutritionCard}>
        <Text style={styles.nutritionTitle}>
          Итого: <Text style={{ color: COLORS.calories, fontWeight: '700' }}>{nutrition.calories} ккал</Text>
        </Text>
        <MacroBar label="Белки" current={nutrition.protein} target={nutrition.protein} color={COLORS.protein} />
        <MacroBar label="Жиры" current={nutrition.fat} target={nutrition.fat} color={COLORS.fat} />
        <MacroBar label="Углеводы" current={nutrition.carbs} target={nutrition.carbs} color={COLORS.carbs} />

        <View style={styles.microDivider} />
        <MacroBar label="Клетчатка" current={nutrition.fiber} target={nutrition.fiber} color={COLORS.fiber} />
        <MacroBar label="Сахар" current={nutrition.sugars} target={nutrition.sugars} color={COLORS.sugars} />
        <MacroBar label="Насыщ. жиры" current={nutrition.saturatedFat} target={nutrition.saturatedFat} color={COLORS.saturatedFat} />
        <MacroBar label="Соль" current={nutrition.salt} target={nutrition.salt} color={COLORS.salt} />
      </View>

      {/* Meal type selector */}
      <Text style={styles.sectionLabel}>Приём пищи</Text>
      <View style={styles.mealTypeRow}>
        {MEAL_TYPE_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.mealTypeBtn, mealType === key && styles.mealTypeBtnActive]}
            onPress={() => setMealType(key)}
          >
            <Text style={[styles.mealTypeText, mealType === key && styles.mealTypeTextActive]}>
              {MEAL_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Confirm button */}
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
        <Text style={styles.confirmBtnText}>Добавить</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },

  // Food header
  foodName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  foodSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },

  // Sections
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  // Grams
  gramsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  gramsInput: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  gramsSuffix: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },

  // Quick select
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickBtnText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  quickBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Nutrition
  nutritionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nutritionTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  microDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  // Meal type
  mealTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  mealTypeBtn: {
    flex: 1,
    minWidth: '40%',
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  mealTypeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealTypeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  mealTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Confirm
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
