import { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const progress = target > 0 ? Math.min(net / target, 1) : 0;
  const overLimit = net > target;

  const size = 130;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="summary" accessibilityLabel={`${t('dash_eaten')} ${eaten} ${t('kcal')}, ${t('dash_burned')} ${burned}, ${t('dash_remaining')} ${remaining}`}>
      {/* Radial glow behind ring */}
      <View pointerEvents="none" style={[styles.glowOuter, { backgroundColor: tint(overLimit ? colors.error : colors.calories, 0.06) }]} />
      <View pointerEvents="none" style={[styles.glowInner, { backgroundColor: tint(overLimit ? colors.error : colors.calories, 0.10) }]} />
      <View style={styles.row}>
        {/* Left: eaten */}
        <View style={styles.stat}>
          <Ionicons name="restaurant" size={18} color={colors.calories} />
          <Text style={[styles.statValue, { color: colors.text }]}>{eaten}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dash_eaten')}</Text>
        </View>

        {/* Center: ring */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.calories}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.12}
              />
              {progress > 0 && (
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={overLimit ? colors.error : colors.calories}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              )}
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringValue, { color: overLimit ? colors.error : colors.calories }]}>
                {remaining}
              </Text>
              <Text style={[styles.ringLabel, { color: colors.textSecondary }]}>
                {overLimit ? t('dash_over') : t('dash_remaining')}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: burned */}
        <View style={styles.stat}>
          <Ionicons name="flame" size={18} color={colors.burned} />
          <Text style={[styles.statValue, { color: colors.text }]}>{burned}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dash_burned')}</Text>
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
    padding: SPACING.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glowOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: '50%',
    left: '50%',
    marginTop: -120,
    marginLeft: -120,
  },
  glowInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    top: '50%',
    left: '50%',
    marginTop: -85,
    marginLeft: -85,
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
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 10,
  },
});
