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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { EXERCISES, calculateCaloriesBurned } from '../constants/exercises';
import { useProfile } from '../hooks/useProfile';
import { useExercises } from '../hooks/useExercises';
import type { ExerciseEntry } from '../types';

const exerciseKeys = Object.keys(EXERCISES);

const EXERCISE_I18N: Record<string, string> = {
  walking: 'ex_walking',
  running: 'ex_running',
  cycling: 'ex_cycling',
  swimming: 'ex_swimming',
  gym: 'ex_gym',
  yoga: 'ex_yoga',
  hiit: 'ex_hiit',
  dancing: 'ex_dancing',
  stretching: 'ex_stretching',
  other: 'ex_other',
};

export default function AddExerciseScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const { profile } = useProfile();
  const { addExercise } = useExercises();
  const insets = useSafeAreaInsets();

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
      Alert.alert(t('error'), t('exercise_error_duration'));
      return;
    }

    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      userId: '1',
      date: new Date().toISOString().slice(0, 10),
      exerciseType: selected,
      name: t(EXERCISE_I18N[selected] as any),
      durationMin: durationNum,
      caloriesBurned: burned,
      createdAt: new Date().toISOString(),
    };

    await addExercise(entry);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + SPACING.lg }]}
    >
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('exercise_type')}</Text>
      <View style={styles.grid}>
        {exerciseKeys.map((key) => {
          const info = EXERCISES[key];
          const active = selected === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.exerciseBtn, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelected(key)}
            >
              <Ionicons
                name={info.icon as any}
                size={24}
                color={active ? '#fff' : colors.text}
              />
              <Text style={[styles.exerciseLabel, { color: colors.text }, active && styles.exerciseLabelActive]}>
                {t(EXERCISE_I18N[key] as any)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('exercise_duration')}</Text>
      <View style={[styles.durationRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.durationInput, { color: colors.text }]}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          maxLength={4}
          selectTextOnFocus
        />
        <Text style={[styles.durationSuffix, { color: colors.textSecondary }]}>{t('min')}</Text>
      </View>

      {/* Quick duration */}
      <View style={styles.quickRow}>
        {[15, 30, 45, 60, 90].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }, duration === String(m) && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setDuration(String(m))}
          >
            <Text style={[styles.quickText, { color: colors.text }, duration === String(m) && styles.quickTextActive]}>
              {m} {t('min')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <View style={[styles.previewCard, { backgroundColor: isDark ? 'rgba(255,152,0,0.1)' : '#FFF8EE', borderColor: isDark ? 'rgba(255,152,0,0.25)' : '#FFE0B2' }]}>
        <Ionicons name="flame" size={28} color={colors.burned} />
        <Text style={[styles.previewBurned, { color: colors.burned }]}>{burned}</Text>
        <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{t('exercise_burned')}</Text>
        <Text style={[styles.previewMeta, { color: colors.border }]}>
          {t(EXERCISE_I18N[selected] as any)} · {durationNum} {t('min')} · MET {exercise.met}
        </Text>
      </View>

      {/* Confirm */}
      <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.confirmText}>{t('exercise_add')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg },
  sectionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  exerciseBtn: {
    width: '30%', flexGrow: 1, alignItems: 'center',
    paddingVertical: SPACING.md, borderRadius: 14, borderWidth: 1,
  },
  exerciseLabel: { fontSize: FONT_SIZE.xs, marginTop: 4, fontWeight: '500' },
  exerciseLabelActive: { color: '#fff', fontWeight: '700' },
  durationRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm,
  },
  durationInput: { flex: 1, fontSize: FONT_SIZE.xxl, fontWeight: '700', paddingVertical: SPACING.sm },
  durationSuffix: { fontSize: FONT_SIZE.lg },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  quickText: { fontSize: FONT_SIZE.xs },
  quickTextActive: { color: '#fff', fontWeight: '700' },
  previewCard: {
    alignItems: 'center', borderRadius: 20, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1,
  },
  previewBurned: { fontSize: 40, fontWeight: '800', marginTop: 4 },
  previewLabel: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  previewMeta: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 16, borderRadius: 14,
  },
  confirmText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
