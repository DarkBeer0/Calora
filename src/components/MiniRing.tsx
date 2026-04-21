import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MiniRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color: string;
  current: number;
  target: number;
  label: string;
  unit?: string;
  moreLabel?: string;
  overLabel?: string;
}

export default function MiniRing({
  size = 72,
  strokeWidth = 6,
  progress,
  color,
  current,
  target,
  label,
  unit = 'g',
  moreLabel = '',
  overLabel = '',
}: MiniRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const isOver = target > 0 && current > target;
  const overBy = isOver ? current - target : 0;
  const remaining = isOver ? 0 : Math.max(target - current, 0);
  const ringColor = isOver ? colors.warning : color;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [clamped]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.12}
          />
          {clamped > 0 && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
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
        <Text style={[styles.ringValue, { color: ringColor }]}>{current}</Text>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <Text
        style={[styles.remaining, { color: isOver ? colors.warning : colors.border }]}
        numberOfLines={1}
      >
        {isOver ? `+${overBy}${unit} ${overLabel}` : `${moreLabel} ${remaining}${unit}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  ringValue: {
    position: 'absolute',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  remaining: {
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
});
