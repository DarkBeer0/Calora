import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useMeals } from '../hooks/useMeals';
import { useExercises } from '../hooks/useExercises';
import { useWater } from '../hooks/useWater';
import { useWeight } from '../hooks/useWeight';
import { useProfile } from '../hooks/useProfile';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

type Period = 'week' | 'month';

function getDateRange(period: Period): string[] {
  const days = period === 'week' ? 7 : 30;
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function shortLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AnalyticsScreen() {
  const { colors, isDark, tint } = useTheme();
  const { t, lang } = useI18n();
  const { getDailySummary, allMeals, refresh: refreshMeals } = useMeals();
  const { allExercises, getExercisesForDate, refresh: refreshExercises } = useExercises();
  const { allEntries: waterEntries, refresh: refreshWater } = useWater();
  const { allEntries: weightEntries, addWeight, refresh: refreshWeight } = useWeight();
  const { profile } = useProfile();

  const [period, setPeriod] = useState<Period>('week');
  const [weightInput, setWeightInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshMeals();
      refreshExercises();
      refreshWater();
      refreshWeight();
    }, [refreshMeals, refreshExercises, refreshWater, refreshWeight])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMeals(), refreshExercises(), refreshWater(), refreshWeight()]);
    setRefreshing(false);
  }, [refreshMeals, refreshExercises, refreshWater, refreshWeight]);

  const dates = getDateRange(period);

  // Calorie data per day
  const calorieData = dates.map((d) => {
    const summary = getDailySummary(d);
    return summary.totalCalories;
  });

  const hasCalorieData = calorieData.some((v) => v > 0);
  const daysLogged = calorieData.filter((v) => v > 0).length;
  const avgCalories = daysLogged > 0 ? Math.round(calorieData.reduce((a, b) => a + b, 0) / daysLogged) : 0;

  // Macro averages for pie chart
  const macroTotals = { protein: 0, fat: 0, carbs: 0 };
  dates.forEach((d) => {
    const s = getDailySummary(d);
    macroTotals.protein += s.totalProtein;
    macroTotals.fat += s.totalFat;
    macroTotals.carbs += s.totalCarbs;
  });
  const macroSum = macroTotals.protein + macroTotals.fat + macroTotals.carbs;

  // Weight data
  const weightData = weightEntries.filter((e) => {
    const first = dates[0];
    const last = dates[dates.length - 1];
    return e.date >= first && e.date <= last;
  });
  const hasWeightData = weightData.length >= 1;

  // Labels: show every Nth label to avoid clutter
  const labelStep = period === 'week' ? 1 : 5;
  const labels = dates.map((d, i) => (i % labelStep === 0 || i === dates.length - 1) ? shortLabel(d) : '');

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalCount: 0,
    color: (opacity = 1) => tint(colors.primary, opacity),
    labelColor: () => colors.textSecondary,
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
    propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '4' },
  };

  const handleAddWeight = async () => {
    const raw = weightInput.replace(',', '.');
    const w = parseFloat(raw);
    if (!w || w <= 0 || w >= 500) return;
    try {
      await addWeight(w);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWeightInput('');
    } catch (e) {
      Alert.alert(t('error'), String(e));
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        profile: profile ? { age: profile.age, weight: profile.weight, height: profile.height, gender: profile.gender, goal: profile.goal } : null,
        meals: allMeals,
        exercises: allExercises,
        water: waterEntries,
        weight: weightEntries,
      };
      const json = JSON.stringify(data, null, 2);
      const fileName = `calora_export_${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: t('analytics_export') });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t('error'), t('analytics_export_error'));
    }
  };

  const handleImport = () => {
    Alert.alert(t('analytics_import'), t('analytics_import_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('analytics_import_confirm_yes'),
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/json',
              copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.[0]) return;

            const fileUri = result.assets[0].uri;
            const pickedFile = new File(fileUri);
            const json = await pickedFile.text();
            const data = JSON.parse(json);

            // Validate structure
            if (!data.meals && !data.exercises && !data.water && !data.weight) {
              Alert.alert(t('error'), t('analytics_import_error'));
              return;
            }

            // Write each data set to AsyncStorage
            if (data.meals) await AsyncStorage.setItem('calora_meals', JSON.stringify(data.meals));
            if (data.exercises) await AsyncStorage.setItem('calora_exercises', JSON.stringify(data.exercises));
            if (data.water) await AsyncStorage.setItem('calora_water', JSON.stringify(data.water));
            if (data.weight) await AsyncStorage.setItem('calora_weight', JSON.stringify(data.weight));

            // Refresh all hooks
            await Promise.all([refreshMeals(), refreshExercises(), refreshWater(), refreshWeight()]);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('✓', t('analytics_import_success'));
          } catch {
            Alert.alert(t('error'), t('analytics_import_error'));
          }
        },
      },
    ]);
  };

  const pieData = macroSum > 0 ? [
    { name: t('dash_protein'), value: Math.round(macroTotals.protein), color: colors.protein, legendFontColor: colors.textSecondary, legendFontSize: 13 },
    { name: t('dash_fat'), value: Math.round(macroTotals.fat), color: colors.fat, legendFontColor: colors.textSecondary, legendFontSize: 13 },
    { name: t('dash_carbs'), value: Math.round(macroTotals.carbs), color: colors.carbs, legendFontColor: colors.textSecondary, legendFontSize: 13 },
  ] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <Text style={[styles.header, { color: colors.text }]}>{t('analytics_title')}</Text>

        {/* Period toggle */}
        <View style={[styles.periodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.primary }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, { color: period === p ? colors.onPrimary : colors.textSecondary }]}>
                {t(p === 'week' ? 'analytics_week' : 'analytics_month')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.calories }]}>{avgCalories}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('analytics_avg_calories')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{daysLogged}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('analytics_total_days')}</Text>
          </View>
        </View>

        {/* Calorie chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('analytics_calories_chart')}</Text>
          {hasCalorieData ? (
            <LineChart
              data={{ labels, datasets: [{ data: calorieData.map((v) => v || 0) }] }}
              width={CHART_WIDTH - SPACING.md * 2}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withVerticalLines={false}
              fromZero
              segments={4}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={40} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('analytics_no_data')}</Text>
              <Text style={[styles.emptyHint, { color: colors.border }]}>{t('analytics_no_data_hint')}</Text>
            </View>
          )}
        </View>

        {/* Macros pie chart */}
        {macroSum > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('analytics_macros_chart')}</Text>
            <PieChart
              data={pieData}
              width={CHART_WIDTH - SPACING.md * 2}
              height={180}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
        )}

        {/* Weight tracking */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('analytics_weight')}</Text>

          {/* Weight input */}
          <View style={styles.weightInputRow}>
            <View style={[styles.weightInput, { backgroundColor: tint(colors.text, 0.04), borderColor: colors.border }]}>
              <TextInput
                style={[styles.weightTextInput, { color: colors.text }]}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder={t('analytics_weight_placeholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                maxLength={6}
                onSubmitEditing={handleAddWeight}
                returnKeyType="done"
              />
              <Text style={[styles.weightSuffix, { color: colors.textSecondary }]}>kg</Text>
            </View>
            <TouchableOpacity
              style={[styles.weightAddBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddWeight}
            >
              <Ionicons name="add" size={22} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Latest weight badge */}
          {hasWeightData && (
            <View style={styles.latestWeightRow}>
              <Ionicons name="scale-outline" size={18} color={colors.weight} />
              <Text style={[styles.latestWeightText, { color: colors.text }]}>
                {weightData[weightData.length - 1].weight} kg
              </Text>
              <Text style={[styles.latestWeightDate, { color: colors.textSecondary }]}>
                {shortLabel(weightData[weightData.length - 1].date)}
              </Text>
            </View>
          )}

          {/* Weight chart */}
          {weightData.length >= 2 ? (
            <LineChart
              data={{
                labels: weightData.map((e, i) => (i === 0 || i === weightData.length - 1) ? shortLabel(e.date) : ''),
                datasets: [{ data: weightData.map((e) => e.weight) }],
              }}
              width={CHART_WIDTH - SPACING.md * 2}
              height={180}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => tint(colors.weight, opacity),
                propsForDots: { r: '5', strokeWidth: '2', stroke: colors.weight },
              }}
              bezier
              style={styles.chart}
              withVerticalLines={false}
              segments={3}
            />
          ) : !hasWeightData ? (
            <View style={styles.emptyChart}>
              <Ionicons name="scale-outline" size={36} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('analytics_no_weight')}</Text>
              <Text style={[styles.emptyHint, { color: colors.border }]}>{t('analytics_no_weight_hint')}</Text>
            </View>
          ) : null}
        </View>

        {/* Export / Import buttons */}
        <View style={styles.dataButtons}>
          <TouchableOpacity
            style={[styles.dataBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color={colors.primary} />
            <Text style={[styles.dataBtnText, { color: colors.primary }]}>{t('analytics_export')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dataBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleImport}
            activeOpacity={0.7}
          >
            <Ionicons name="push-outline" size={20} color={colors.calories} />
            <Text style={[styles.dataBtnText, { color: colors.calories }]}>{t('analytics_import')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.lg },

  periodRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 4, fontWeight: '500' },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },

  chart: { borderRadius: 12, marginLeft: -SPACING.sm },

  emptyChart: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm },
  emptyHint: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },

  weightInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  weightInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
  },
  weightTextInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    fontWeight: '600',
  },
  weightSuffix: { fontSize: FONT_SIZE.sm },
  weightAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dataButtons: { flexDirection: 'row', gap: SPACING.sm },
  dataBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: SPACING.md,
  },
  dataBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },

  latestWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(156,39,176,0.08)',
    borderRadius: 10,
  },
  latestWeightText: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  latestWeightDate: { fontSize: FONT_SIZE.xs, marginLeft: 'auto' },
});
