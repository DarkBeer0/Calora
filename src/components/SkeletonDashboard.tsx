import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

function SkeletonBlock({ width, height, borderRadius = 10 }: { width: number | string; height: number; borderRadius?: number }) {
  const { isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: isDark ? '#333' : '#E0E0E0',
        opacity: pulse,
      }}
    />
  );
}

export default function SkeletonDashboard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SkeletonBlock width={120} height={28} borderRadius={8} />
      <View style={{ height: 8 }} />
      <SkeletonBlock width={200} height={14} borderRadius={6} />

      <View style={{ height: SPACING.lg }} />
      <SkeletonBlock width="100%" height={160} borderRadius={20} />

      <View style={{ height: SPACING.lg }} />
      <View style={styles.macroRow}>
        <SkeletonBlock width={72} height={100} borderRadius={14} />
        <SkeletonBlock width={72} height={100} borderRadius={14} />
        <SkeletonBlock width={72} height={100} borderRadius={14} />
      </View>

      <View style={{ height: SPACING.md }} />
      <SkeletonBlock width="100%" height={130} borderRadius={20} />

      <View style={{ height: SPACING.lg }} />
      <SkeletonBlock width={140} height={18} borderRadius={6} />
      <View style={{ height: SPACING.sm }} />
      <SkeletonBlock width="100%" height={56} borderRadius={14} />

      <View style={{ height: SPACING.lg }} />
      <SkeletonBlock width={120} height={18} borderRadius={6} />
      <View style={{ height: SPACING.sm }} />
      <SkeletonBlock width="100%" height={60} borderRadius={14} />
      <View style={{ height: SPACING.sm }} />
      <SkeletonBlock width="100%" height={60} borderRadius={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 60,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
