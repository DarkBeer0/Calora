import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import { ACTIVITY_LEVELS, GOALS } from '../constants/nutrition';
import { calculateDailyTarget } from '../utils/nutrition';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import type { UserProfile, NutritionTarget } from '../types';

type Gender = UserProfile['gender'];
type ActivityLevel = UserProfile['activityLevel'];
type Goal = UserProfile['goal'];

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'male', label: 'Мужской' },
  { key: 'female', label: 'Женский' },
];

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string }[] = (
  Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]
).map((key) => ({ key, label: ACTIVITY_LEVELS[key].label }));

const GOAL_OPTIONS: { key: Goal; label: string }[] = (
  Object.keys(GOALS) as Goal[]
).map((key) => ({ key, label: GOALS[key].label }));

export default function ProfileScreen() {
  const { colors, isDark, toggle: toggleTheme } = useTheme();
  const { profile, saveProfile, isLoading } = useProfile();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');

  useEffect(() => {
    if (!isLoading) {
      setAge(String(profile.age));
      setWeight(String(profile.weight));
      setHeight(String(profile.height));
      setGender(profile.gender);
      setActivityLevel(profile.activityLevel);
      setGoal(profile.goal);
    }
  }, [isLoading, profile]);

  // Live recalculation on every field change
  const currentProfile: UserProfile = useMemo(() => ({
    ...profile,
    age: parseInt(age, 10) || 0,
    weight: parseFloat(weight) || 0,
    height: parseFloat(height) || 0,
    gender,
    activityLevel,
    goal,
  }), [profile, age, weight, height, gender, activityLevel, goal]);

  const target = useMemo(() => {
    if (currentProfile.age > 0 && currentProfile.weight > 0 && currentProfile.height > 0) {
      return calculateDailyTarget(currentProfile);
    }
    return null;
  }, [currentProfile]);

  const handleSave = () => {
    if (!currentProfile.age || !currentProfile.weight || !currentProfile.height) {
      Alert.alert('Ошибка', 'Заполните все числовые поля');
      return;
    }

    saveProfile(currentProfile);
    Alert.alert('Готово', 'Профиль сохранён');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Профиль</Text>

      {/* Numeric inputs */}
      <View style={styles.row}>
        <NumericField label="Возраст" value={age} onChange={setAge} suffix="лет" />
        <NumericField label="Вес" value={weight} onChange={setWeight} suffix="кг" />
        <NumericField label="Рост" value={height} onChange={setHeight} suffix="см" />
      </View>

      {/* Gender */}
      <Text style={styles.sectionLabel}>Пол</Text>
      <SegmentedControl
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={(v) => setGender(v)}
      />

      {/* Activity */}
      <Text style={styles.sectionLabel}>Активность</Text>
      <OptionList
        options={ACTIVITY_OPTIONS}
        selected={activityLevel}
        onSelect={(v) => setActivityLevel(v)}
      />

      {/* Goal */}
      <Text style={styles.sectionLabel}>Цель</Text>
      <SegmentedControl
        options={GOAL_OPTIONS}
        selected={goal}
        onSelect={(v) => setGoal(v)}
      />

      {/* Theme toggle */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>Тема</Text>
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
        <Text style={[styles.themeToggleText, { color: colors.text }]}>
          {isDark ? 'Тёмная тема' : 'Светлая тема'}
        </Text>
        <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Save button */}
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>Сохранить</Text>
      </TouchableOpacity>

      {/* KBJU Target */}
      {target && (
        <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.targetTitle, { color: colors.text }]}>Ваша дневная норма</Text>
          <View style={styles.targetRow}>
            <TargetBadge label="Ккал" value={target.calories} color={colors.calories} />
            <TargetBadge label="Белки" value={target.protein} color={colors.protein} suffix="г" />
            <TargetBadge label="Жиры" value={target.fat} color={colors.fat} suffix="г" />
            <TargetBadge label="Углев." value={target.carbs} color={colors.carbs} suffix="г" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* ---- Small components ---- */

function NumericField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.numericField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          maxLength={5}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.segmentItem, selected === opt.key && styles.segmentItemActive]}
          onPress={() => onSelect(opt.key)}
        >
          <Text
            style={[styles.segmentText, selected === opt.key && styles.segmentTextActive]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function OptionList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
}) {
  return (
    <View style={styles.optionList}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.optionItem, selected === opt.key && styles.optionItemActive]}
          onPress={() => onSelect(opt.key)}
        >
          <Text
            style={[styles.optionText, selected === opt.key && styles.optionTextActive]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TargetBadge({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeValue, { color }]}>
        {value}
        {suffix ?? ''}
      </Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  // Numeric fields row
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  numericField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  suffix: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  // Section labels
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Option list (vertical)
  optionList: {
    gap: SPACING.xs,
  },
  optionItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },

  // Theme toggle
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeToggleText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // Save button
  saveButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  // Target card
  targetCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  targetTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
  },
  badgeValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  badgeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
