import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
  /** Already consumed today (before this food). Shows as lighter fill. */
  alreadyConsumed?: number;
}

export default function MacroBar({ label, current, target, color, unit = 'g', alreadyConsumed }: MacroBarProps) {
  const { colors } = useTheme();

  // Simple mode (no daily context) — just show current vs target
  if (alreadyConsumed === undefined) {
    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          <Text style={styles.values}>
            <Text style={{ color, fontWeight: '600' }}>{current}</Text>
            <Text style={{ color: colors.textSecondary }}> / {target}{unit}</Text>
          </Text>
        </View>
        <View style={[styles.trackBg, { backgroundColor: `${color}20` }]}>
          <View style={[styles.trackFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  // Daily context mode — show how this food fills the remaining daily need
  const totalAfter = alreadyConsumed + current;
  const consumedPct = target > 0 ? Math.min(alreadyConsumed / target, 1) : 0;
  const totalPct = target > 0 ? Math.min(totalAfter / target, 1) : 0;
  const isOver = totalAfter > target;
  const overAmount = isOver ? Math.round((totalAfter - target) * 10) / 10 : 0;
  const remaining = Math.max(target - alreadyConsumed, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={styles.valuesRow}>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
            +<Text style={{ color, fontWeight: '600' }}>{current}</Text>
          </Text>
          {isOver ? (
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.error, fontWeight: '600', marginLeft: 4 }}>
              (+{overAmount} {unit})
            </Text>
          ) : (
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, marginLeft: 4 }}>
              {Math.round(totalAfter * 10) / 10}/{target}{unit}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.trackBg, { backgroundColor: `${color}15` }]}>
        {/* Already consumed (dimmer) */}
        <View style={[styles.trackFill, { width: `${consumedPct * 100}%`, backgroundColor: color, opacity: 0.3 }]} />
        {/* This food's contribution (brighter, on top) */}
        <View style={[styles.trackFillOverlay, { left: `${consumedPct * 100}%`, width: `${(totalPct - consumedPct) * 100}%`, backgroundColor: isOver ? colors.error : color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  values: {
    fontSize: FONT_SIZE.sm,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
  trackFillOverlay: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
});
