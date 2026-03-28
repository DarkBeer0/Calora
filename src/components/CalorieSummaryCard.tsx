import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';

interface CalorieSummaryCardProps {
  eaten: number;
  burned: number;
  target: number;
}

export default function CalorieSummaryCard({ eaten, burned, target }: CalorieSummaryCardProps) {
  const net = eaten - burned;
  const remaining = Math.max(target - net, 0);
  const progress = target > 0 ? Math.min(net / target, 1) : 0;
  const overLimit = net > target;

  const size = 130;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Left: eaten */}
        <View style={styles.stat}>
          <Ionicons name="restaurant" size={18} color={COLORS.calories} />
          <Text style={styles.statValue}>{eaten}</Text>
          <Text style={styles.statLabel}>Потреблено</Text>
        </View>

        {/* Center: ring */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={COLORS.calories}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.12}
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={overLimit ? COLORS.error : COLORS.calories}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringValue, overLimit && { color: COLORS.error }]}>
                {remaining}
              </Text>
              <Text style={styles.ringLabel}>
                {overLimit ? 'перебор' : 'осталось'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: burned */}
        <View style={styles.stat}>
          <Ionicons name="flame" size={18} color={COLORS.error} />
          <Text style={styles.statValue}>{burned}</Text>
          <Text style={styles.statLabel}>Сожжено</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    width: 80,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.calories,
  },
  ringLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
