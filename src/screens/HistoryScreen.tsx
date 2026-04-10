import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useMeals } from '../hooks/useMeals';
import MealCard from '../components/MealCard';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { DailySummary, MealEntry } from '../types';

const MEAL_I18N: Record<string, string> = {
  breakfast: 'meal_breakfast',
  lunch: 'meal_lunch',
  dinner: 'meal_dinner',
  snack: 'meal_snack',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { datesWithMeals, getDailySummary, deleteMeal, copyMealsToToday, isLoading, refresh } = useMeals();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data when screen gets focus (e.g. after adding meal)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleCopyDay = useCallback(async (date: string) => {
    await copyMealsToToday(date);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('done'), t('history_copied'));
  }, [copyMealsToToday, t]);

  const handleEditMeal = useCallback((meal: MealEntry) => {
    navigation.navigate('ConfirmMeal', { food: meal.foodItem, editMeal: meal });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (datesWithMeals.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={48} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('history_empty')}</Text>
        <Text style={[styles.emptyHint, { color: colors.border }]}>{t('history_empty_hint')}</Text>
      </View>
    );
  }

  const dateLocale = lang === 'pl' ? 'pl-PL' : lang === 'en' ? 'en-US' : 'ru-RU';

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) return t('history_today');
    if (dateStr === yesterdayStr) return t('history_yesterday');

    return d.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'long' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{t('history_title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Recipes')}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={datesWithMeals}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item: date }) => {
          const summary = getDailySummary(date);
          const isExpanded = expandedDate === date;

          return (
            <View style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => setExpandedDate(isExpanded ? null : date)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayDate, { color: colors.text }]}>{formatDate(date)}</Text>
                  <Text style={[styles.daySummary, { color: colors.textSecondary }]}>
                    {summary.totalCalories} {t('kcal')} · P {Math.round(summary.totalProtein)} · F {Math.round(summary.totalFat)} · C {Math.round(summary.totalCarbs)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => handleCopyDay(date)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>{t('history_copy')}</Text>
                </TouchableOpacity>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginLeft: SPACING.sm }}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.dayContent, { borderTopColor: colors.border }]}>
                  {groupByMealType(summary).map(({ type, meals }) => (
                    <View key={type} style={styles.mealGroup}>
                      <Text style={[styles.mealGroupTitle, { color: colors.text }]}>{t(MEAL_I18N[type] as any)}</Text>
                      {meals.map((meal) => (
                        <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} onPress={handleEditMeal} />
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

/* ---- Helpers ---- */

function groupByMealType(summary: DailySummary) {
  const order = ['breakfast', 'lunch', 'dinner', 'snack'];
  const map = new Map<string, typeof summary.meals>();

  for (const meal of summary.meals) {
    const list = map.get(meal.mealType) ?? [];
    list.push(meal);
    map.set(meal.mealType, list);
  }

  return order
    .filter((t) => map.has(t))
    .map((t) => ({ type: t, meals: map.get(t)! }));
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  headerActions: { flexDirection: 'row', gap: SPACING.xs },
  headerBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  loadingText: { fontSize: FONT_SIZE.md },
  emptyText: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm },
  emptyHint: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, textAlign: 'center' },
  dayCard: { borderRadius: 20, borderWidth: 1, marginBottom: SPACING.sm, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 8 },
  copyBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  dayDate: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  daySummary: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  dayContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderTopWidth: 1, paddingTop: SPACING.sm },
  mealGroup: { marginBottom: SPACING.xs },
  mealGroupTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.xs },
});
