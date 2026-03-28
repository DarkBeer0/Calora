import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import type { MealEntry } from '../types';

interface MealCardProps {
  meal: MealEntry;
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onDelete }: MealCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{meal.foodItem.name}</Text>
        <Text style={styles.meta}>{meal.grams}г · {meal.calories} ккал</Text>
      </View>
      <View style={styles.macros}>
        <Text style={[styles.macroText, { color: COLORS.protein }]}>Б {meal.protein}</Text>
        <Text style={[styles.macroText, { color: COLORS.fat }]}>Ж {meal.fat}</Text>
        <Text style={[styles.macroText, { color: COLORS.carbs }]}>У {meal.carbs}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(meal.id)}>
          <Ionicons name="close-circle-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  left: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  macroText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: SPACING.sm,
    padding: 2,
  },
});
