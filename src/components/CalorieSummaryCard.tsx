import { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

interface CalorieSummaryCardProps {
  eaten: number;
  burned: number;
  target: number;
}

function CalorieSummaryCardInner({ eaten, burned, target }: CalorieSummaryCardProps) {
  const { colors, tint } = useTheme();
  const { t } = useI18n();

  const net = eaten - burned;
  const remaining = Math.max(target - net, 0);
  const overBy = Math.max(net - target, 0);
  const overLimit = net > target;
  const progress = target > 0 ? Math.min(Math.max(net / target, 0), 1) : 0;
  const accent = overLimit ? colors.error : colors.calories;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityRole="summary"
      accessibilityLabel={`${t('dash_eaten')} ${eaten} ${t('kcal')}, ${t('dash_burned')} ${burned}, ${t('dash_remaining')} ${remaining}`}
    >
      {/* Top row: hero number */}
      <View style={styles.heroRow}>
        <Text style={[styles.heroValue, { color: accent }]}>
          {overLimit ? `+${overBy}` : remaining}
        </Text>
        <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>{t('kcal')}</Text>
      </View>
      <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
        {overLimit ? t('dash_over') : t('dash_remaining')}
      </Text>

      {/* Progress bar */}
      <View style={[styles.barTrack, { backgroundColor: tint(accent, 0.12) }]}>
        <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: accent }]} />
      </View>
      <Text style={[styles.barCaption, { color: colors.textSecondary }]}>
        {Math.max(net, 0)} / {target} {t('kcal')}
      </Text>

      {/* Bottom stats */}
      <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
        <View style={styles.stat}>
          <View style={[styles.statIcon, { backgroundColor: tint(colors.calories, 0.12) }]}>
            <Ionicons name="restaurant" size={16} color={colors.calories} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: colors.text }]}>{eaten}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dash_eaten')}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.stat}>
          <View style={[styles.statIcon, { backgroundColor: tint(colors.burned, 0.12) }]}>
            <Ionicons name="flame" size={16} color={colors.burned} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: colors.text }]}>{burned}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dash_burned')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CalorieSummaryCard = memo(CalorieSummaryCardInner);
export default CalorieSummaryCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  heroUnit: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCaption: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: -2,
  },
  divider: {
    width: 1,
    height: 32,
  },
});
