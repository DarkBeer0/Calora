import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import { MEAL_LABELS } from '../constants/nutrition';
import { useMeals } from '../hooks/useMeals';
import MealCard from '../components/MealCard';
import type { DailySummary } from '../types';

export default function HistoryScreen() {
  const { datesWithMeals, getDailySummary, deleteMeal, isLoading } = useMeals();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (datesWithMeals.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
        <Text style={styles.emptyText}>История пуста</Text>
        <Text style={styles.emptyHint}>Добавьте первый приём пищи на главном экране</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>История</Text>
      <FlatList
        data={datesWithMeals}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: date }) => {
          const summary = getDailySummary(date);
          const isExpanded = expandedDate === date;

          return (
            <View style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => setExpandedDate(isExpanded ? null : date)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.dayDate}>{formatDateRu(date)}</Text>
                  <Text style={styles.daySummary}>
                    {summary.totalCalories} ккал · Б {Math.round(summary.totalProtein)} · Ж {Math.round(summary.totalFat)} · У {Math.round(summary.totalCarbs)}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.dayContent}>
                  {groupByMealType(summary).map(({ type, meals }) => (
                    <View key={type} style={styles.mealGroup}>
                      <Text style={styles.mealGroupTitle}>{MEAL_LABELS[type] ?? type}</Text>
                      {meals.map((meal) => (
                        <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
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

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'Сегодня';
  if (dateStr === yesterdayStr) return 'Вчера';

  return d.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.border,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Day card
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  dayDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  daySummary: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dayContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  mealGroup: {
    marginBottom: SPACING.xs,
  },
  mealGroupTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});
