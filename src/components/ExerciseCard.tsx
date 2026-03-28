import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import type { ExerciseEntry } from '../types';

interface ExerciseCardProps {
  exercise: ExerciseEntry;
  icon?: string;
  onDelete?: (id: string) => void;
}

export default function ExerciseCard({ exercise, icon, onDelete }: ExerciseCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={(icon as any) || 'fitness'} size={20} color={COLORS.error} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.meta}>{exercise.durationMin} мин</Text>
      </View>
      <Text style={styles.burned}>-{exercise.caloriesBurned} ккал</Text>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(exercise.id)}>
          <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
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
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  burned: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  deleteBtn: {
    marginLeft: SPACING.sm,
    padding: 2,
  },
});
