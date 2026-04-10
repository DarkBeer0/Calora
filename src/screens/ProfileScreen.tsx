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

const ACTIVITY_ICONS: Record<ActivityLevel, string> = {
  sedentary: 'bed-outline',
  light: 'walk-outline',
  moderate: 'bicycle-outline',
  active: 'barbell-outline',
  veryActive: 'flame-outline',
};

export default function ProfileScreen() {
  const { colors, isDark, toggle: toggleTheme, tint } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { profile, saveProfile, isLoading } = useProfile();
  const { settings: notifSettings, toggleSetting: toggleNotif, isSupported: notifSupported } = useNotifications();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waterGoal, setWaterGoal] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [notifExpanded, setNotifExpanded] = useState(false);

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

  const GOAL_ICONS: Record<Goal, string> = {
    lose: 'trending-down',
    maintain: 'swap-horizontal',
    gain: 'trending-up',
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{t('profile_title')}</Text>

      {/* Card 1: Body Metrics */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.metricsRow}>
          <NumericField label={t('profile_age')} value={age} onChange={setAge} suffix={t('profile_age_unit')} colors={colors} />
          <NumericField label={t('profile_weight')} value={weight} onChange={setWeight} suffix={t('profile_weight_unit')} colors={colors} />
          <NumericField label={t('profile_height')} value={height} onChange={setHeight} suffix={t('profile_height_unit')} colors={colors} />
          <NumericField label={t('water_goal')} value={waterGoal} onChange={setWaterGoal} suffix={t('water_ml')} colors={colors} />
        </View>

        {/* Gender — compact */}
        <View style={styles.genderRow}>
          {(['male', 'female'] as Gender[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.genderBtn, { backgroundColor: gender === key ? tint(colors.primary, 0.12) : 'transparent', borderColor: gender === key ? colors.primary : colors.border }]}
              onPress={() => setGender(key)}
            >
              <Ionicons name={key === 'male' ? 'male' : 'female'} size={16} color={gender === key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.genderText, { color: gender === key ? colors.primary : colors.text }]}>
                {t(key === 'male' ? 'profile_male' : 'profile_female')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Norm — immediate feedback */}
      {target && (
        <View style={[styles.normCard, { backgroundColor: tint(colors.primary, 0.06), borderColor: tint(colors.primary, 0.15) }]}>
          <View style={styles.normRow}>
            <NormBadge value={target.calories} label={t('kcal')} color={colors.calories} />
            <NormBadge value={target.protein} label={t('dash_protein')} color={colors.protein} suffix={t('g')} />
            <NormBadge value={target.fat} label={t('dash_fat')} color={colors.fat} suffix={t('g')} />
            <NormBadge value={target.carbs} label={t('dash_carbs')} color={colors.carbs} suffix={t('g')} />
          </View>
        </View>
      )}

      {/* Card 2: Activity & Goal */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Activity — icon grid */}
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('profile_activity')}</Text>
        <View style={styles.activityGrid}>
          {ACTIVITY_KEYS.map((key) => {
            const active = activityLevel === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.activityChip, { backgroundColor: active ? tint(colors.primary, 0.12) : tint(colors.text, 0.04), borderColor: active ? colors.primary : 'transparent' }]}
                onPress={() => setActivityLevel(key)}
              >
                <Ionicons name={ACTIVITY_ICONS[key] as any} size={18} color={active ? colors.primary : colors.textSecondary} />
                <Text style={[styles.activityText, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                  {t(ACTIVITY_I18N[key] as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Goal — icon segments */}
        <Text style={[styles.cardLabel, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('profile_goal')}</Text>
        <View style={styles.goalRow}>
          {GOAL_KEYS.map((key) => {
            const active = goal === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.goalBtn, { backgroundColor: active ? colors.primary : tint(colors.text, 0.04) }]}
                onPress={() => setGoal(key)}
              >
                <Ionicons name={GOAL_ICONS[key] as any} size={16} color={active ? '#fff' : colors.textSecondary} />
                <Text style={[styles.goalText, { color: active ? '#fff' : colors.text }]}>
                  {t(GOAL_I18N[key] as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Card 3: Preferences */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Theme */}
        <TouchableOpacity style={styles.prefRow} onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
          <Text style={[styles.prefText, { color: colors.text }]}>
            {isDark ? t('profile_theme_dark') : t('profile_theme_light')}
          </Text>
          <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Language */}
        <View style={styles.prefRow}>
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={[styles.prefText, { color: colors.text }]}>{t('profile_language')}</Text>
        </View>
        <View style={styles.langRow}>
          {LANGUAGE_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.langBtn, { backgroundColor: lang === key ? colors.primary : tint(colors.text, 0.04) }]}
              onPress={() => setLang(key)}
            >
              <Text style={[styles.langText, { color: lang === key ? '#fff' : colors.text }]}>
                {LANGUAGE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications — collapsible */}
      {notifSupported && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.prefRow} onPress={() => setNotifExpanded(!notifExpanded)} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={[styles.prefText, { color: colors.text }]}>{t('notif_section')}</Text>
            <Ionicons name={notifExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {notifExpanded && (
            <View style={{ marginTop: SPACING.sm, gap: SPACING.xs }}>
              {([
                { key: 'meals' as const, icon: 'restaurant', label: t('notif_meals') },
                { key: 'water' as const, icon: 'water', label: t('notif_water') },
                { key: 'summary' as const, icon: 'stats-chart', label: t('notif_summary') },
              ]).map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.notifRow, { backgroundColor: tint(colors.text, 0.04) }]}
                  onPress={() => toggleNotif(item.key, {
                    notif_breakfast_title: t('notif_breakfast_title'), notif_breakfast_body: t('notif_breakfast_body'),
                    notif_lunch_title: t('notif_lunch_title'), notif_lunch_body: t('notif_lunch_body'),
                    notif_dinner_title: t('notif_dinner_title'), notif_dinner_body: t('notif_dinner_body'),
                    notif_water_title: t('notif_water_title'), notif_water_body: t('notif_water_body'),
                    notif_summary_title: t('notif_summary_title'), notif_summary_body: t('notif_summary_body'),
                  })}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon as any} size={16} color={notifSettings[item.key] ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.notifLabel, { color: colors.text }]}>{item.label}</Text>
                  <View style={[styles.notifDot, { backgroundColor: notifSettings[item.key] ? colors.primary : colors.border }]}>
                    {notifSettings[item.key] && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Save */}
      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveBtnText}>{t('save')}</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
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
      <View style={[styles.fieldValueRow, { borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 4, borderStyle: 'dashed' }]}>
        <TextInput
          style={[styles.fieldInput, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          maxLength={5}
          selectTextOnFocus
        />
        <Text style={[styles.fieldSuffix, { color: colors.textSecondary }]}>{suffix}</Text>
      </View>
    </View>
  );
}

function NormBadge({ value, label, color, suffix }: { value: number; label: string; color: string; suffix?: string }) {
  return (
    <View style={styles.normBadge}>
      <Text style={[styles.normValue, { color }]}>{value}{suffix ?? ''}</Text>
      <Text style={[styles.normLabel, { color }]}>{label}</Text>
    </View>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FONT_SIZE.md },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md },

  // Cards
  card: {
    borderRadius: 16, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  cardLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },

  // Body metrics
  metricsRow: { flexDirection: 'row', gap: SPACING.sm },
  numericField: { flex: 1, alignItems: 'center' },
  fieldLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  fieldValueRow: { alignItems: 'center' },
  fieldInput: { fontSize: FONT_SIZE.lg, fontWeight: '700', textAlign: 'center', padding: 0, minWidth: 40 },
  fieldSuffix: { fontSize: 10, marginTop: 1 },

  // Gender
  genderRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  genderText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Daily norm
  normCard: {
    borderRadius: 16, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  normRow: { flexDirection: 'row', justifyContent: 'space-around' },
  normBadge: { alignItems: 'center' },
  normValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  normLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.7 },

  // Activity grid
  activityGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs,
  },
  activityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
  },
  activityText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },

  // Goal
  goalRow: { flexDirection: 'row', gap: SPACING.sm },
  goalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: 10,
  },
  goalText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Preferences
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  prefText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  divider: { height: 1, marginVertical: SPACING.sm },
  langRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  langText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Notifications
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10,
  },
  notifLabel: { flex: 1, fontSize: FONT_SIZE.xs, fontWeight: '500' },
  notifDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 14,
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
