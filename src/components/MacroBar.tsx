import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, current, target, color, unit = 'г' }: MacroBarProps) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color, fontWeight: '600' }}>{current}</Text>
          <Text style={styles.divider}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.trackBg}>
        <View style={[styles.trackFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
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
    marginBottom: 4,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  values: {
    fontSize: FONT_SIZE.sm,
  },
  divider: {
    color: COLORS.textSecondary,
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
});
