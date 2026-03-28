import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { DAILY_MICRO_TARGETS } from '../constants/nutrition';
import { EXERCISES } from '../constants/exercises';
import { calculateDailyTarget } from '../utils/nutrition';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useProfile } from '../hooks/useProfile';
import { useMeals } from '../hooks/useMeals';
import { useExercises } from '../hooks/useExercises';
import CalorieSummaryCard from '../components/CalorieSummaryCard';
import MiniRing from '../components/MiniRing';
import MealCard from '../components/MealCard';
import ExerciseCard from '../components/ExerciseCard';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MealEntry } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_I18N: Record<string, string> = {
  breakfast: 'meal_breakfast',
  lunch: 'meal_lunch',
  dinner: 'meal_dinner',
  snack: 'meal_snack',
};

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { t, lang } = useI18n();
  const { profile, isLoading: profileLoading } = useProfile();
  const { todaySummary, todayMeals, deleteMeal, isLoading: mealsLoading } = useMeals();
  const { todayExercises, todayBurned, deleteExercise, isLoading: exLoading } = useExercises();

  if (profileLoading || mealsLoading || exLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
      </View>
    );
  }

  const target = calculateDailyTarget(profile);
  const { totalCalories, totalProtein, totalFat, totalCarbs, totalFiber, totalSugars, totalSaturatedFat, totalSalt } = todaySummary;
  const mealGroups = groupByMealType(todayMeals);

  const dateLocale = lang === 'pl' ? 'pl-PL' : lang === 'en' ? 'en-US' : 'ru-RU';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>{t('app_name')}</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Calorie summary */}
        <CalorieSummaryCard eaten={totalCalories} burned={todayBurned} target={target.calories} />

        {/* Macro mini rings */}
        <View style={[styles.macroRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MiniRing progress={target.protein > 0 ? totalProtein / target.protein : 0} color={colors.protein} current={Math.round(totalProtein)} target={target.protein} label={t('dash_protein')} moreLabel={t('dash_more')} />
          <MiniRing progress={target.fat > 0 ? totalFat / target.fat : 0} color={colors.fat} current={Math.round(totalFat)} target={target.fat} label={t('dash_fat')} moreLabel={t('dash_more')} />
          <MiniRing progress={target.carbs > 0 ? totalCarbs / target.carbs : 0} color={colors.carbs} current={Math.round(totalCarbs)} target={target.carbs} label={t('dash_carbs')} moreLabel={t('dash_more')} />
        </View>

        {/* Micro nutrients */}
        <View style={[styles.microCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dash_extra')}</Text>
          <MicroRow label={t('dash_fiber')} current={r1(totalFiber)} target={DAILY_MICRO_TARGETS.fiber} color={colors.fiber} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} good />
          <MicroRow label={t('dash_sugars')} current={r1(totalSugars)} target={DAILY_MICRO_TARGETS.sugars} color={colors.sugars} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
          <MicroRow label={t('dash_sat_fat')} current={r1(totalSaturatedFat)} target={DAILY_MICRO_TARGETS.saturatedFat} color={colors.saturatedFat} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
          <MicroRow label={t('dash_salt')} current={r1(totalSalt)} target={DAILY_MICRO_TARGETS.salt} color={colors.salt} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
        </View>

        {/* Exercises */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dash_exercises')}</Text>
          <TouchableOpacity style={[styles.addExerciseBtn, { backgroundColor: isDark ? 'rgba(239,83,80,0.15)' : '#FFF0ED' }]} onPress={() => navigation.navigate('AddExercise')}>
            <Ionicons name="flame" size={16} color={colors.error} />
            <Text style={[styles.addExerciseText, { color: colors.error }]}>{t('dash_add_exercise')}</Text>
          </TouchableOpacity>
        </View>

        {todayExercises.length === 0 ? (
          <TouchableOpacity style={[styles.exerciseEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('AddExercise')}>
            <Ionicons name="bicycle-outline" size={28} color={colors.border} />
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('dash_add_workout')}</Text>
          </TouchableOpacity>
        ) : (
          todayExercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} icon={EXERCISES[ex.exerciseType]?.icon} onDelete={deleteExercise} />
          ))
        )}

        {/* Meals */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dash_meals')}</Text>
        </View>

        {mealGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={40} color={colors.border} />
            <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, marginTop: SPACING.sm }}>{t('dash_no_meals')}</Text>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.border, marginTop: SPACING.xs }}>{t('dash_no_meals_hint')}</Text>
          </View>
        ) : (
          mealGroups.map(({ type, meals }) => (
            <View key={type} style={styles.mealGroup}>
              <Text style={[styles.mealGroupTitle, { color: colors.text }]}>{t(MEAL_I18N[type] as any)}</Text>
              {meals.map((meal) => <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />)}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddMeal')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ---- Helpers ---- */

const r1 = (v: number) => Math.round(v * 10) / 10;

function groupByMealType(meals: MealEntry[]) {
  const order = ['breakfast', 'lunch', 'dinner', 'snack'];
  const map = new Map<string, MealEntry[]>();
  for (const meal of meals) {
    const list = map.get(meal.mealType) ?? [];
    list.push(meal);
    map.set(meal.mealType, list);
  }
  return order.filter((t) => map.has(t)).map((t) => ({ type: t, meals: map.get(t)! }));
}

function MicroRow({ label, current, target, color, errorColor, textColor, subColor, good }: {
  label: string; current: number; target: number; color: string; errorColor: string; textColor: string; subColor: string; good?: boolean;
}) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const warn = good ? false : current > target;
  return (
    <View style={microS.row}>
      <View style={[microS.dot, { backgroundColor: color }]} />
      <Text style={[microS.label, { color: textColor }]}>{label}</Text>
      <View style={[microS.barBg, { backgroundColor: warn ? `${errorColor}20` : `${color}20` }]}>
        <View style={[microS.barFill, { width: `${progress * 100}%`, backgroundColor: warn ? errorColor : color }]} />
      </View>
      <Text style={[microS.value, { color: warn ? errorColor : subColor }]}>{current}/{target}g</Text>
    </View>
  );
}

const microS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  label: { fontSize: FONT_SIZE.xs, width: 90, fontWeight: '500' },
  barBg: { flex: 1, height: 6, borderRadius: 3, marginRight: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  value: { fontSize: 11, width: 65, textAlign: 'right', fontWeight: '500' },
});

/* ---- Styles ---- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FONT_SIZE.md },
  header: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  dateText: { fontSize: FONT_SIZE.sm, marginTop: 2, marginBottom: SPACING.lg, textTransform: 'capitalize' },

  macroRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: 20, paddingVertical: SPACING.md,
    borderWidth: 1,
  },

  microCard: {
    borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 10 },
  addExerciseText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  exerciseEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderStyle: 'dashed',
  },

  mealGroup: { marginBottom: SPACING.md },
  mealGroupTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.xs },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.lg },

  fab: {
    position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
});
