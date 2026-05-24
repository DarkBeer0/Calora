import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CustomAlert from '../components/CustomAlert';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { calculateDailyTarget } from '../utils/nutrition';
import type { UserProfile } from '../types';

type Gender = UserProfile['gender'];
type ActivityLevel = UserProfile['activityLevel'];
type Goal = UserProfile['goal'];

const ACTIVITY_KEYS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];
const GOAL_KEYS: Goal[] = ['lose', 'maintain', 'gain'];

const ACTIVITY_ICONS: Record<ActivityLevel, string> = {
  sedentary: 'bed-outline',
  light: 'walk-outline',
  moderate: 'bicycle-outline',
  active: 'barbell-outline',
  veryActive: 'flame-outline',
};

const GOAL_I18N_SUBTITLE: Record<Goal, 'profile_hero_subtitle_lose' | 'profile_hero_subtitle_maintain' | 'profile_hero_subtitle_gain'> = {
  lose: 'profile_hero_subtitle_lose',
  maintain: 'profile_hero_subtitle_maintain',
  gain: 'profile_hero_subtitle_gain',
};

export default function ProfileScreen() {
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const { profile, saveProfile, isLoading } = useProfile();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waterGoal, setWaterGoal] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIcon, setAlertIcon] = useState<'checkmark-circle' | 'alert-circle'>('checkmark-circle');

  const showAlert = (title: string, msg: string, icon: 'checkmark-circle' | 'alert-circle' = 'checkmark-circle') => {
    setAlertTitle(title);
    setAlertMessage(msg);
    setAlertIcon(icon);
    setAlertVisible(true);
  };

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
    const a = currentProfile.age;
    const w = currentProfile.weight;
    const h = currentProfile.height;
    const wg = currentProfile.waterGoal;

    if (!a || !w || !h) {
      showAlert(t('error'), t('profile_error_fields'), 'alert-circle');
      return;
    }
    if (a < 10 || a > 120) {
      showAlert(t('error'), t('profile_error_age'), 'alert-circle');
      return;
    }
    if (w < 20 || w > 350) {
      showAlert(t('error'), t('profile_error_weight'), 'alert-circle');
      return;
    }
    if (h < 80 || h > 250) {
      showAlert(t('error'), t('profile_error_height'), 'alert-circle');
      return;
    }
    if (!wg || wg < 500 || wg > 10000) {
      showAlert(t('error'), t('profile_error_water'), 'alert-circle');
      return;
    }
    saveProfile(currentProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert(t('done'), t('profile_saved'));
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

  const heroSubtitle = `${currentProfile.age || '—'} ${t('profile_age_unit')} · ${t(GOAL_I18N_SUBTITLE[goal])}${target ? ` · ${target.calories} ${t('kcal')}` : ''}`;

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{t('profile_title')}</Text>

      {/* Hero block */}
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: tint(colors.primary, 0.12) }]}>
          <Ionicons name={gender === 'male' ? 'man' : 'woman'} size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={1}>
            {t('profile_section_me')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {heroSubtitle}
          </Text>
        </View>
      </View>

      {/* Section: About me */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profile_section_me')}</Text>

      {/* Body Metrics card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.metricsRow}>
          <NumericField label={t('profile_age')} value={age} onChange={setAge} suffix={t('profile_age_unit')} colors={colors} />
          <NumericField label={t('profile_weight')} value={weight} onChange={setWeight} suffix={t('profile_weight_unit')} colors={colors} />
          <NumericField label={t('profile_height')} value={height} onChange={setHeight} suffix={t('profile_height_unit')} colors={colors} />
          <NumericField label={t('water_goal')} value={waterGoal} onChange={setWaterGoal} suffix={t('water_ml')} colors={colors} />
        </View>

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

      {/* Daily norm */}
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

      {/* Activity & Goal card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                <Ionicons name={GOAL_ICONS[key] as any} size={18} color={active ? '#fff' : colors.textSecondary} />
                <Text style={[styles.goalText, { color: active ? '#fff' : colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {t(GOAL_I18N[key] as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveBtnText}>{t('save')}</Text>
      </TouchableOpacity>

      {/* Section: Other */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: SPACING.lg }]}>{t('profile_section_app')}</Text>

      <NavRow
        icon="settings-outline"
        iconColor={colors.primary}
        title={t('profile_section_app')}
        subtitle={t('profile_section_app_subtitle')}
        onPress={() => navigation.navigate('AppSettings')}
        colors={colors}
        tint={tint}
      />

      <NavRow
        icon="help-buoy-outline"
        iconColor={colors.water}
        title={t('profile_section_support')}
        subtitle={t('profile_section_support_subtitle')}
        onPress={() => navigation.navigate('Support')}
        colors={colors}
        tint={tint}
      />

      <View style={{ height: 20 }} />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        icon={alertIcon}
        onDismiss={() => setAlertVisible(false)}
      />
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

function NavRow({
  icon, iconColor, title, subtitle, onPress, colors, tint,
}: {
  icon: any; iconColor: string; title: string; subtitle: string;
  onPress: () => void;
  colors: { surface: string; border: string; text: string; textSecondary: string };
  tint: (color: string, opacity: number) => string;
}) {
  return (
    <TouchableOpacity
      style={[styles.navRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.navIcon, { backgroundColor: tint(iconColor, 0.12) }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.navTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FONT_SIZE.md },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.md },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: 16, borderWidth: 1,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  heroSubtitle: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  // Section labels
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },

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
  goalRow: { flexDirection: 'row', gap: SPACING.xs },
  goalBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 2, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10,
  },
  goalText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Nav rows (sub-screens)
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: 16, borderWidth: 1,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  navIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  navSubtitle: { fontSize: 11, marginTop: 2 },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 14,
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
