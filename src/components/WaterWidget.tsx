import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';

interface WaterWidgetProps {
  todayTotal: number;
  goal: number;
  onAdd: (ml: number) => void;
  onUndo: () => void;
}

const QUICK_AMOUNTS = [150, 250, 350, 500];

export default function WaterWidget({ todayTotal, goal, onAdd, onUndo }: WaterWidgetProps) {
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const rawProgress = goal > 0 ? Math.min(todayTotal / goal, 1) : 0;

  const fillAnim = useRef(new Animated.Value(0)).current;
  const waterColor = colors.water;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: rawProgress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [rawProgress]);

  const barFillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const confirmAdd = (ml: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(ml);
  };

  const handleAdd = (ml: number) => {
    const newTotal = todayTotal + ml;
    if (todayTotal <= goal && newTotal > goal) {
      Alert.alert(
        t('water_warning_title'),
        t('water_warning_msg'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('water_warning_ok'), onPress: () => confirmAdd(ml) },
        ]
      );
    } else {
      confirmAdd(ml);
    }
  };

  const handleCustomAdd = () => {
    const ml = parseInt(customMl, 10);
    if (ml > 0) {
      handleAdd(ml);
      setCustomMl('');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${t('water_title')}: ${todayTotal} ${t('water_of')} ${goal} ${t('water_ml')}`}
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          {/* Water drop tile */}
          <View style={[styles.iconTile, { backgroundColor: tint(waterColor, 0.15) }]}>
            <Ionicons name="water" size={28} color={waterColor} />
          </View>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{t('water_title')}</Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              <Text style={{ color: waterColor, fontWeight: '700' }}>{todayTotal}</Text> {t('water_of')} {goal} {t('water_ml')}
              {'  ·  '}
              <Text style={{ color: waterColor, fontWeight: '700' }}>{Math.round(rawProgress * 100)}%</Text>
            </Text>
            {/* Horizontal progress bar */}
            <View style={[styles.barTrack, { backgroundColor: tint(waterColor, 0.12) }]}>
              <Animated.View style={[styles.barFill, { width: barFillWidth, backgroundColor: waterColor }]} />
            </View>
          </View>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Quick add buttons */}
          <View style={styles.buttonsRow}>
            {QUICK_AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[styles.addBtn, { backgroundColor: tint(waterColor, 0.12) }]}
                onPress={() => handleAdd(ml)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${t('add')} ${ml} ${t('water_ml')}`}
              >
                <Text style={[styles.addBtnText, { color: waterColor }]}>+{ml}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom input */}
          <View style={styles.customRow}>
            <View style={[styles.customInput, { backgroundColor: tint(waterColor, 0.08), borderColor: colors.border }]}>
              <TextInput
                style={[styles.customTextInput, { color: colors.text }]}
                value={customMl}
                onChangeText={setCustomMl}
                placeholder={t('water_ml')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={5}
                onSubmitEditing={() => { handleCustomAdd(); Keyboard.dismiss(); }}
                returnKeyType="done"
              />
              <Text style={[styles.customSuffix, { color: colors.textSecondary }]}>{t('water_ml')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.customAddBtn, { backgroundColor: waterColor }]}
              onPress={() => { handleCustomAdd(); Keyboard.dismiss(); }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Undo */}
          {todayTotal > 0 && (
            <TouchableOpacity style={styles.undoRow} onPress={onUndo}>
              <Ionicons name="arrow-undo-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.undoText, { color: colors.textSecondary }]}>{t('water_undo')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandedContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  addBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  customInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
  },
  customTextInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    fontWeight: '600',
  },
  customSuffix: {
    fontSize: FONT_SIZE.sm,
  },
  customAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  undoText: {
    fontSize: FONT_SIZE.xs,
  },
});
