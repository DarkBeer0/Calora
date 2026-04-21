import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

interface Props {
  current: number;
  best: number;
}

export default function StreakWidget({ current, best }: Props) {
  const { colors, tint } = useTheme();
  const { t } = useI18n();

  const scale = useRef(new Animated.Value(1)).current;
  const prevCurrent = useRef(current);

  useEffect(() => {
    if (current > prevCurrent.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    prevCurrent.current = current;
  }, [current]);

  if (current === 0) return null;

  const isHot = current >= 7;
  const isWarm = current >= 3;
  const accentColor = isHot ? '#FF6D00' : isWarm ? colors.calories : colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: tint(accentColor, 0.1),
          borderColor: tint(accentColor, 0.25),
          transform: [{ scale }],
        },
        isHot && styles.hotShadow,
        isHot && { shadowColor: accentColor },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tint(accentColor, 0.18) }]}>
        <Ionicons name="flame" size={30} color={accentColor} />
      </View>
      <View style={styles.textBlock}>
        <View style={styles.row}>
          <Text style={[styles.count, { color: accentColor }]}>{current}</Text>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('streak_days')}
          </Text>
        </View>
        {best > current ? (
          <Text style={[styles.best, { color: colors.textSecondary }]}>
            {t('streak_best')}: {best}
          </Text>
        ) : (
          <Text style={[styles.best, { color: tint(accentColor, 0.8) }]}>
            {isHot ? t('streak_hot') : isWarm ? t('streak_warm') : t('streak_keep')}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  hotShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  count: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  best: { fontSize: FONT_SIZE.xs, marginTop: 2, fontWeight: '500' },
});
