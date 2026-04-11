import { View, Text, StyleSheet } from 'react-native';
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

  if (current === 0 && best === 0) return null;

  const isHot = current >= 7;
  const isWarm = current >= 3;
  const accentColor = isHot ? '#FF6D00' : isWarm ? colors.calories : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: tint(accentColor, 0.08), borderColor: tint(accentColor, 0.2) }]}>
      <View style={[styles.iconCircle, { backgroundColor: tint(accentColor, 0.15) }]}>
        <Ionicons name="flame" size={22} color={accentColor} />
      </View>
      <View style={styles.textBlock}>
        <View style={styles.row}>
          <Text style={[styles.count, { color: accentColor }]}>{current}</Text>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('streak_days')}
          </Text>
        </View>
        {best > current && (
          <Text style={[styles.best, { color: colors.textSecondary }]}>
            {t('streak_best')}: {best}
          </Text>
        )}
      </View>
      {current > 0 && (
        <Text style={styles.emoji}>
          {isHot ? '🔥' : isWarm ? '⚡' : '✨'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  count: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  best: { fontSize: 11, marginTop: 1 },
  emoji: { fontSize: 20 },
});
