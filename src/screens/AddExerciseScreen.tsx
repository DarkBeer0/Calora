import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import { EXERCISES, calculateCaloriesBurned } from '../constants/exercises';
import { useProfile } from '../hooks/useProfile';
import { useExercises } from '../hooks/useExercises';
import type { ExerciseEntry } from '../types';

const exerciseKeys = Object.keys(EXERCISES);

export default function AddExerciseScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { addExercise } = useExercises();

  const [selected, setSelected] = useState<string>('walking');
  const [duration, setDuration] = useState('30');

  const durationNum = parseInt(duration, 10) || 0;
  const exercise = EXERCISES[selected];

  const burned = useMemo(
    () => calculateCaloriesBurned(exercise.met, profile.weight, durationNum),
    [exercise.met, profile.weight, durationNum]
  );

  const handleConfirm = async () => {
    if (durationNum <= 0) {
      Alert.alert('Ошибка', 'Укажите длительность');
      return;
    }

    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      userId: '1',
      date: new Date().toISOString().slice(0, 10),
      exerciseType: selected,
      name: exercise.label,
      durationMin: durationNum,
      caloriesBurned: burned,
      createdAt: new Date().toISOString(),
    };

    await addExercise(entry);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>Тип упражнения</Text>
      <View style={styles.grid}>
        {exerciseKeys.map((key) => {
          const info = EXERCISES[key];
          const active = selected === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.exerciseBtn, active && styles.exerciseBtnActive]}
              onPress={() => setSelected(key)}
            >
              <Ionicons
                name={info.icon as any}
                size={24}
                color={active ? '#fff' : COLORS.text}
              />
              <Text style={[styles.exerciseLabel, active && styles.exerciseLabelActive]}>
                {info.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Длительность</Text>
      <View style={styles.durationRow}>
        <TextInput
          style={styles.durationInput}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          maxLength={4}
          selectTextOnFocus
        />
        <Text style={styles.durationSuffix}>мин</Text>
      </View>

      {/* Quick duration */}
      <View style={styles.quickRow}>
        {[15, 30, 45, 60, 90].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.quickBtn, duration === String(m) && styles.quickBtnActive]}
            onPress={() => setDuration(String(m))}
          >
            <Text style={[styles.quickText, duration === String(m) && styles.quickTextActive]}>
              {m} мин
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <View style={styles.previewCard}>
        <Ionicons name="flame" size={28} color={COLORS.error} />
        <Text style={styles.previewBurned}>{burned}</Text>
        <Text style={styles.previewLabel}>ккал будет сожжено</Text>
        <Text style={styles.previewMeta}>
          {exercise.label} · {durationNum} мин · MET {exercise.met}
        </Text>
      </View>

      {/* Confirm */}
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
        <Ionicons name="flame" size={20} color="#fff" />
        <Text style={styles.confirmText}>Добавить упражнение</Text>
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
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  exerciseBtn: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  exerciseLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    marginTop: 4,
    fontWeight: '500',
  },
  exerciseLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Duration
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  durationInput: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  durationSuffix: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },

  // Quick
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
  quickText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
  },
  quickTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Preview
  previewCard: {
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFE0DB',
  },
  previewBurned: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.error,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewMeta: {
    fontSize: FONT_SIZE.xs,
    color: '#BDBDBD',
    marginTop: SPACING.xs,
  },

  // Confirm
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
