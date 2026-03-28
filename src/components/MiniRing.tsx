import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONT_SIZE } from '../constants/theme';

interface MiniRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color: string;
  current: number;
  target: number;
  label: string;
  unit?: string;
}

export default function MiniRing({
  size = 72,
  strokeWidth = 6,
  progress,
  color,
  current,
  target,
  label,
  unit = 'г',
}: MiniRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clamped);
  const remaining = Math.max(target - current, 0);

  return (
    <View style={[styles.wrapper, { width: size }]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.15}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <Text style={[styles.ringValue, { color }]}>{current}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.remaining}>ещё {remaining}{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ringValue: {
    position: 'absolute',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
  remaining: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 1,
  },
});
