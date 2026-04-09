import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
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
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const progress = goal > 0 ? Math.min(todayTotal / goal, 1) : 0;

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const fillHeight = fillAnim.interpolate({
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
      // First time exceeding goal — show warning
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

  const waterColor = '#42A5F5';
  const waterBg = isDark ? 'rgba(66,165,245,0.12)' : 'rgba(66,165,245,0.08)';
  const goalReached = todayTotal >= goal;

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
          {/* Glass visualization */}
          <View style={[styles.glass, { backgroundColor: waterBg }]}>
            <Animated.View style={[styles.glassFill, { height: fillHeight, backgroundColor: goalReached ? '#66BB6A' : waterColor }]} />
            <Ionicons name="water" size={18} color={goalReached ? '#66BB6A' : waterColor} style={styles.glassIcon} />
          </View>

          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{t('water_title')}</Text>
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              <Text style={{ color: goalReached ? '#66BB6A' : waterColor, fontWeight: '700' }}>{todayTotal}</Text> {t('water_of')} {goal} {t('water_ml')}
            </Text>
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
                style={[styles.addBtn, { backgroundColor: waterBg }]}
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
            <View style={[styles.customInput, { backgroundColor: waterBg, borderColor: colors.border }]}>
              <TextInput
                style={[styles.customTextInput, { color: colors.text }]}
                value={customMl}
                onChangeText={setCustomMl}
                placeholder={t('water_ml')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={5}
                onSubmitEditing={handleCustomAdd}
                returnKeyType="done"
              />
              <Text style={[styles.customSuffix, { color: colors.textSecondary }]}>{t('water_ml')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.customAddBtn, { backgroundColor: waterColor }]}
              onPress={handleCustomAdd}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  glass: {
    width: 40,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  glassFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 10,
    opacity: 0.4,
  },
  glassIcon: {
    marginBottom: 6,
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
