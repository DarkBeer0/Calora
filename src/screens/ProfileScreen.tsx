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
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useI18n, LANGUAGE_LABELS } from '../i18n';
import type { Language } from '../i18n';
import { calculateDailyTarget } from '../utils/nutrition';
import { useNotifications } from '../hooks/useNotifications';
import type { UserProfile } from '../types';

type Gender = UserProfile['gender'];
type ActivityLevel = UserProfile['activityLevel'];
type Goal = UserProfile['goal'];

const ACTIVITY_KEYS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];
const GOAL_KEYS: Goal[] = ['lose', 'maintain', 'gain'];
const LANGUAGE_KEYS: Language[] = ['ru', 'en', 'pl'];

export default function ProfileScreen() {
  const { colors, isDark, toggle: toggleTheme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { profile, saveProfile, isLoading } = useProfile();
  const { settings: notifSettings, toggleSetting: toggleNotif } = useNotifications();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waterGoal, setWaterGoal] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');

  useEffect(() => {
    if (!isLoading) {
      setAge(String(profile.age));
      setWeight(String(profile.weight));
      setHeight(String(profile.height));
      setWaterGoal(String(profile.waterGoal ?? 2000));
      setGender(profile.gender);
      setActivityLevel(profile.activityLevel);
      setGoal(profile.goal);
    }
  }, [isLoading, profile]);

  const currentProfile: UserProfile = useMemo(() => ({
    ...profile,
    age: parseInt(age, 10) || 0,
    weight: parseFloat(weight) || 0,
    height: parseFloat(height) || 0,
    waterGoal: parseInt(waterGoal, 10) || 2000,
    gender,
    activityLevel,
    goal,
  }), [profile, age, weight, height, waterGoal, gender, activityLevel, goal]);

  const target = useMemo(() => {
    if (currentProfile.age > 0 && currentProfile.weight > 0 && currentProfile.height > 0) {
      return calculateDailyTarget(currentProfile);
    }
    return null;
  }, [currentProfile]);

  const handleSave = () => {
    if (!currentProfile.age || !currentProfile.weight || !currentProfile.height) {
      Alert.alert(t('error'), t('profile_error_fields'));
      return;
    }
    saveProfile(currentProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('done'), t('profile_saved'));
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
      </View>
    );
  }

  const ACTIVITY_I18N: Record<ActivityLevel, string> = {
    sedentary: 'activity_sedentary',
    light: 'activity_light',
    moderate: 'activity_moderate',
    active: 'activity_active',
    veryActive: 'activity_very_active',
  };

  const GOAL_I18N: Record<Goal, string> = {
    lose: 'goal_lose',
    maintain: 'goal_maintain',
    gain: 'goal_gain',
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{t('profile_title')}</Text>

      {/* Numeric inputs */}
      <View style={styles.row}>
        <NumericField label={t('profile_age')} value={age} onChange={setAge} suffix={t('profile_age_unit')} colors={colors} />
        <NumericField label={t('profile_weight')} value={weight} onChange={setWeight} suffix={t('profile_weight_unit')} colors={colors} />
        <NumericField label={t('profile_height')} value={height} onChange={setHeight} suffix={t('profile_height_unit')} colors={colors} />
      </View>

      {/* Water goal */}
      <View style={styles.row}>
        <NumericField label={t('water_goal')} value={waterGoal} onChange={setWaterGoal} suffix={t('water_ml')} colors={colors} />
      </View>

      {/* Gender */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('profile_gender')}</Text>
      <View style={styles.segmented}>
        {(['male', 'female'] as Gender[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.segmentItem, { backgroundColor: colors.surface, borderColor: colors.border }, gender === key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setGender(key)}
          >
            <Text style={[styles.segmentText, { color: colors.text }, gender === key && styles.segmentTextActive]}>
              {t(key === 'male' ? 'profile_male' : 'profile_female')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('profile_activity')}</Text>
      <View style={styles.optionList}>
        {ACTIVITY_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.optionItem, { backgroundColor: colors.surface, borderColor: colors.border }, activityLevel === key && { backgroundColor: isDark ? `${colors.primary}30` : '#E8F5E9', borderColor: colors.primary }]}
            onPress={() => setActivityLevel(key)}
          >
            <Text style={[styles.optionText, { color: colors.text }, activityLevel === key && { color: colors.primary, fontWeight: '600' }]}>
              {t(ACTIVITY_I18N[key] as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Goal */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('profile_goal')}</Text>
      <View style={styles.segmented}>
        {GOAL_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.segmentItem, { backgroundColor: colors.surface, borderColor: colors.border }, goal === key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setGoal(key)}
          >
            <Text style={[styles.segmentText, { color: colors.text }, goal === key && styles.segmentTextActive]}>
              {t(GOAL_I18N[key] as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Theme toggle */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('profile_theme')}</Text>
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
        <Text style={[styles.settingRowText, { color: colors.text }]}>
          {isDark ? t('profile_theme_dark') : t('profile_theme_light')}
        </Text>
        <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Language selector */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('profile_language')}</Text>
      <View style={styles.segmented}>
        {LANGUAGE_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.segmentItem, { backgroundColor: colors.surface, borderColor: colors.border }, lang === key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setLang(key)}
          >
            <Text style={[styles.segmentText, { color: colors.text }, lang === key && styles.segmentTextActive]}>
              {LANGUAGE_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('notif_section')}</Text>
      <View style={styles.notifList}>
        <NotifToggle
          icon="restaurant"
          label={t('notif_meals')}
          desc={t('notif_meals_desc')}
          enabled={notifSettings.meals}
          onToggle={() => toggleNotif('meals', {
            notif_breakfast_title: t('notif_breakfast_title'), notif_breakfast_body: t('notif_breakfast_body'),
            notif_lunch_title: t('notif_lunch_title'), notif_lunch_body: t('notif_lunch_body'),
            notif_dinner_title: t('notif_dinner_title'), notif_dinner_body: t('notif_dinner_body'),
            notif_water_title: t('notif_water_title'), notif_water_body: t('notif_water_body'),
            notif_summary_title: t('notif_summary_title'), notif_summary_body: t('notif_summary_body'),
          })}
          colors={colors}
        />
        <NotifToggle
          icon="water"
          label={t('notif_water')}
          desc={t('notif_water_desc')}
          enabled={notifSettings.water}
          onToggle={() => toggleNotif('water', {
            notif_breakfast_title: t('notif_breakfast_title'), notif_breakfast_body: t('notif_breakfast_body'),
            notif_lunch_title: t('notif_lunch_title'), notif_lunch_body: t('notif_lunch_body'),
            notif_dinner_title: t('notif_dinner_title'), notif_dinner_body: t('notif_dinner_body'),
            notif_water_title: t('notif_water_title'), notif_water_body: t('notif_water_body'),
            notif_summary_title: t('notif_summary_title'), notif_summary_body: t('notif_summary_body'),
          })}
          colors={colors}
        />
        <NotifToggle
          icon="stats-chart"
          label={t('notif_summary')}
          desc={t('notif_summary_desc')}
          enabled={notifSettings.summary}
          onToggle={() => toggleNotif('summary', {
            notif_breakfast_title: t('notif_breakfast_title'), notif_breakfast_body: t('notif_breakfast_body'),
            notif_lunch_title: t('notif_lunch_title'), notif_lunch_body: t('notif_lunch_body'),
            notif_dinner_title: t('notif_dinner_title'), notif_dinner_body: t('notif_dinner_body'),
            notif_water_title: t('notif_water_title'), notif_water_body: t('notif_water_body'),
            notif_summary_title: t('notif_summary_title'), notif_summary_body: t('notif_summary_body'),
          })}
          colors={colors}
        />
      </View>

      {/* Save button */}
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>{t('save')}</Text>
      </TouchableOpacity>

      {/* KBJU Target */}
      {target && (
        <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.targetTitle, { color: colors.text }]}>{t('profile_daily_norm')}</Text>
          <View style={styles.targetRow}>
            <TargetBadge label={t('kcal')} value={target.calories} color={colors.calories} textSecondary={colors.textSecondary} />
            <TargetBadge label={t('dash_protein')} value={target.protein} color={colors.protein} suffix={t('g')} textSecondary={colors.textSecondary} />
            <TargetBadge label={t('dash_fat')} value={target.fat} color={colors.fat} suffix={t('g')} textSecondary={colors.textSecondary} />
            <TargetBadge label={t('dash_carbs')} value={target.carbs} color={colors.carbs} suffix={t('g')} textSecondary={colors.textSecondary} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* ---- Small components ---- */

function NumericField({
  label, value, onChange, suffix, colors,
}: {
  label: string; value: string; onChange: (v: string) => void; suffix: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
}) {
  return (
    <View style={styles.numericField}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          maxLength={5}
        />
        <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text>
      </View>
    </View>
  );
}

function NotifToggle({
  icon, label, desc, enabled, onToggle, colors,
}: {
  icon: string; label: string; desc: string; enabled: boolean; onToggle: () => void;
  colors: { surface: string; border: string; text: string; textSecondary: string; primary: string };
}) {
  return (
    <TouchableOpacity
      style={[styles.notifRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={20} color={enabled ? colors.primary : colors.textSecondary} />
      <View style={styles.notifInfo}>
        <Text style={[styles.notifLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
      <View style={[styles.notifDot, { backgroundColor: enabled ? colors.primary : colors.border }]}>
        {enabled && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

function TargetBadge({
  label, value, color, suffix, textSecondary,
}: {
  label: string; value: number; color: string; suffix?: string; textSecondary: string;
}) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeValue, { color }]}>{value}{suffix ?? ''}</Text>
      <Text style={[styles.badgeLabel, { color: textSecondary }]}>{label}</Text>
    </View>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FONT_SIZE.md },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.lg },

  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  numericField: { flex: 1 },
  fieldLabel: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.sm,
  },
  input: { flex: 1, fontSize: FONT_SIZE.lg, paddingVertical: SPACING.sm },
  suffix: { fontSize: FONT_SIZE.sm },

  sectionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.md, marginBottom: SPACING.sm },

  segmented: { flexDirection: 'row', gap: SPACING.sm },
  segmentItem: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: 14,
    borderWidth: 1, alignItems: 'center',
  },
  segmentText: { fontSize: FONT_SIZE.sm },
  segmentTextActive: { color: '#fff', fontWeight: '700' },

  optionList: { gap: SPACING.xs },
  optionItem: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: 14, borderWidth: 1,
  },
  optionText: { fontSize: FONT_SIZE.sm },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: 14, borderWidth: 1,
  },
  settingRowText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  saveButton: {
    marginTop: SPACING.lg, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  targetCard: {
    marginTop: SPACING.lg, borderRadius: 20, padding: SPACING.lg, borderWidth: 1,
  },
  targetTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: SPACING.md, textAlign: 'center' },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center' },
  badgeValue: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  badgeLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  notifList: { gap: SPACING.xs },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: 14, borderWidth: 1,
  },
  notifInfo: { flex: 1 },
  notifLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  notifDesc: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  notifDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
