import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { DAILY_MICRO_TARGETS } from '../constants/nutrition';
import { EXERCISES } from '../constants/exercises';
import { calculateDailyTarget } from '../utils/nutrition';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useProfile } from '../hooks/useProfile';
import { useMeals } from '../hooks/useMeals';
import { useExercises } from '../hooks/useExercises';
import { useWater } from '../hooks/useWater';
import CalorieSummaryCard from '../components/CalorieSummaryCard';
import MiniRing from '../components/MiniRing';
import ExerciseCard from '../components/ExerciseCard';
import WaterWidget from '../components/WaterWidget';
import StreakWidget from '../components/StreakWidget';
import SkeletonDashboard from '../components/SkeletonDashboard';
import { useStreak } from '../hooks/useStreak';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;


export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark, tint } = useTheme();
  const { t, lang } = useI18n();
  const { profile, isLoading: profileLoading } = useProfile();
  const { todaySummary, isLoading: mealsLoading, refresh: refreshMeals } = useMeals();
  const { todayExercises, todayBurned, deleteExercise, isLoading: exLoading, refresh: refreshExercises } = useExercises();
  const { todayTotal: waterTotal, addWater, removeLastEntry: undoWater, isLoading: waterLoading, refresh: refreshWater } = useWater();
  const { streak, refresh: refreshStreak } = useStreak();

  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [microExpanded, setMicroExpanded] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  // Section fade-in animations
  const fadeCalorie = useRef(new Animated.Value(0)).current;
  const fadeMacro = useRef(new Animated.Value(0)).current;
  const fadeMicro = useRef(new Animated.Value(0)).current;

  const isLoading = profileLoading || mealsLoading || exLoading || waterLoading;

  // Refresh all data when screen gets focus (e.g. after adding exercise/meal)
  useFocusEffect(
    useCallback(() => {
      refreshMeals();
      refreshExercises();
      refreshWater();
      refreshStreak();
    }, [refreshMeals, refreshExercises, refreshWater, refreshStreak])
  );

  useEffect(() => {
    if (!isLoading) {
      Animated.stagger(150, [
        Animated.timing(fadeCalorie, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeMacro, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeMicro, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMeals(), refreshExercises(), refreshWater(), refreshStreak()]);
    setRefreshing(false);
  }, [refreshMeals, refreshExercises, refreshWater, refreshStreak]);

  const toggleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newOpen = !fabOpen;
    setFabOpen(newOpen);
    Animated.spring(fabAnim, {
      toValue: newOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
    }).start();
  };

  const closeFab = () => {
    setFabOpen(false);
    Animated.timing(fabAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleFabAction = (action: 'food' | 'exercise') => {
    closeFab();
    if (action === 'food') navigation.navigate('AddMeal');
    else navigation.navigate('AddExercise');
  };

  const fabRotate = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const fabOption1Scale = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const fabOption2Scale = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const overlayOpacity = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const target = calculateDailyTarget(profile);
  const { totalCalories, totalProtein, totalFat, totalCarbs, totalFiber, totalSugars, totalSaturatedFat, totalSalt } = todaySummary;
  const dateLocale = lang === 'pl' ? 'pl-PL' : lang === 'en' ? 'en-US' : 'ru-RU';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>{t('app_name')}</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Streak */}
        <StreakWidget current={streak.current} best={streak.best} />

        {/* Calorie summary */}
        <Animated.View style={{ opacity: fadeCalorie, transform: [{ translateY: fadeCalorie.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <CalorieSummaryCard eaten={totalCalories} burned={todayBurned} target={target.calories} />
        </Animated.View>

        {/* Macro mini rings */}
        <Animated.View style={[styles.macroRow, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeMacro, transform: [{ translateY: fadeMacro.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <MiniRing progress={target.protein > 0 ? totalProtein / target.protein : 0} color={colors.protein} current={Math.round(totalProtein)} target={target.protein} label={t('dash_protein')} moreLabel={t('dash_more')} />
          <MiniRing progress={target.fat > 0 ? totalFat / target.fat : 0} color={colors.fat} current={Math.round(totalFat)} target={target.fat} label={t('dash_fat')} moreLabel={t('dash_more')} />
          <MiniRing progress={target.carbs > 0 ? totalCarbs / target.carbs : 0} color={colors.carbs} current={Math.round(totalCarbs)} target={target.carbs} label={t('dash_carbs')} moreLabel={t('dash_more')} />
        </Animated.View>

        {/* Micro nutrients — collapsible */}
        <Animated.View style={[styles.microCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeMicro, transform: [{ translateY: fadeMicro.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <TouchableOpacity style={styles.microHeader} onPress={() => setMicroExpanded(!microExpanded)} activeOpacity={0.7}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dash_extra')}</Text>
            <Ionicons name={microExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {microExpanded && (
            <View style={{ marginTop: SPACING.sm }}>
              <MicroRow label={t('dash_fiber')} current={r1(totalFiber)} target={DAILY_MICRO_TARGETS.fiber} color={colors.fiber} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} good />
              <MicroRow label={t('dash_sugars')} current={r1(totalSugars)} target={DAILY_MICRO_TARGETS.sugars} color={colors.sugars} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
              <MicroRow label={t('dash_sat_fat')} current={r1(totalSaturatedFat)} target={DAILY_MICRO_TARGETS.saturatedFat} color={colors.saturatedFat} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
              <MicroRow label={t('dash_salt')} current={r1(totalSalt)} target={DAILY_MICRO_TARGETS.salt} color={colors.salt} errorColor={colors.error} textColor={colors.text} subColor={colors.textSecondary} />
            </View>
          )}
        </Animated.View>

        {/* Water - centered */}
        <WaterWidget
          todayTotal={waterTotal}
          goal={profile.waterGoal ?? 2000}
          onAdd={addWater}
          onUndo={undoWater}
        />

        {/* Exercises — only show when there are entries */}
        {todayExercises.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dash_exercises')}</Text>
              <TouchableOpacity style={[styles.addExerciseBtn, { backgroundColor: tint(colors.burned, 0.12) }]} onPress={() => navigation.navigate('AddExercise')}>
                <Ionicons name="flame" size={16} color={colors.burned} />
                <Text style={[styles.addExerciseText, { color: colors.burned }]}>{t('dash_add_exercise')}</Text>
              </TouchableOpacity>
            </View>
            {todayExercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} icon={EXERCISES[ex.exerciseType]?.icon} onDelete={deleteExercise} />
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FAB Speed Dial */}
      {fabOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeFab}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: overlayOpacity }]} />
        </TouchableOpacity>
      )}

      <View style={styles.fabContainer} pointerEvents="box-none">
        {fabOpen && (
          <View style={styles.fabOptions} pointerEvents="box-none">
            {/* Exercise option */}
            <Animated.View style={[styles.fabOptionRow, { opacity: fabAnim, transform: [{ scale: fabOption2Scale }] }]}>
              <TouchableOpacity style={styles.fabOptionTouchable} onPress={() => handleFabAction('exercise')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel={t('fab_exercise')}>
                <Text style={[styles.fabLabel, { color: colors.text, backgroundColor: colors.surface }]}>{t('fab_exercise')}</Text>
                <View style={[styles.fabMini, { backgroundColor: colors.burned }]}>
                  <Ionicons name="flame" size={22} color={colors.onPrimary} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Food option */}
            <Animated.View style={[styles.fabOptionRow, { opacity: fabAnim, transform: [{ scale: fabOption1Scale }] }]}>
              <TouchableOpacity style={styles.fabOptionTouchable} onPress={() => handleFabAction('food')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel={t('fab_food')}>
                <Text style={[styles.fabLabel, { color: colors.text, backgroundColor: colors.surface }]}>{t('fab_food')}</Text>
                <View style={[styles.fabMini, { backgroundColor: colors.calories }]}>
                  <Ionicons name="restaurant" size={22} color={colors.onPrimary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Main FAB */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={toggleFab} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('add')} accessibilityState={{ expanded: fabOpen }}>
          <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
            <Ionicons name="add" size={32} color={colors.onPrimary} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---- Helpers ---- */

const r1 = (v: number) => Math.round(v * 10) / 10;

function MicroRow({ label, current, target, color, errorColor, textColor, subColor, good }: {
  label: string; current: number; target: number; color: string; errorColor: string; textColor: string; subColor: string; good?: boolean;
}) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const warn = good ? false : current > target;
  return (
    <View style={microS.row}>
      <View style={[microS.dot, { backgroundColor: color }]} />
      <Text style={[microS.label, { color: textColor }]}>{label}</Text>
      <View style={[microS.barBg, { backgroundColor: warn ? `${errorColor}20` : `${color}20` }]}>
        <View style={[microS.barFill, { width: `${progress * 100}%`, backgroundColor: warn ? errorColor : color }]} />
      </View>
      <Text style={[microS.value, { color: warn ? errorColor : subColor }]}>{current}/{target}g</Text>
    </View>
  );
}

const microS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  label: { fontSize: FONT_SIZE.xs, width: 90, fontWeight: '500' },
  barBg: { flex: 1, height: 6, borderRadius: 3, marginRight: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  value: { fontSize: 11, width: 65, textAlign: 'right', fontWeight: '500' },
});

/* ---- Styles ---- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  dateText: { fontSize: FONT_SIZE.sm, marginTop: 2, marginBottom: SPACING.lg, textTransform: 'capitalize' },

  macroRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: 20, paddingVertical: SPACING.md,
    borderWidth: 1,
  },

  microCard: {
    borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1,
  },
  microHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 10 },
  addExerciseText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    alignItems: 'flex-end',
    zIndex: 20,
    elevation: 20,
  },

  fabOptions: {
    alignItems: 'flex-end',
    zIndex: 21,
    elevation: 21,
  },

  fab: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
  },

  fabOptionRow: {
    marginBottom: SPACING.sm,
  },

  fabOptionTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 4,
  },

  fabMini: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },

  fabLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    overflow: 'hidden',
  },
});
