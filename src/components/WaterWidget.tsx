import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
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

// Human silhouette SVG path (simplified standing figure)
const BODY_PATH =
  'M25 8 C25 3.6 21.4 0 17 0 C12.6 0 9 3.6 9 8 C9 12.4 12.6 16 17 16 C21.4 16 25 12.4 25 8 Z ' + // head
  'M6 20 C4 20 2 22 2 24 L2 38 C2 40 4 42 6 42 L8 42 L8 34 L7 56 C7 58 9 60 11 60 L12 60 C14 60 15 58 15 56 L17 44 L19 56 C19 58 20 60 22 60 L23 60 C25 60 27 58 27 56 L26 34 L26 42 L28 42 C30 42 32 40 32 38 L32 24 C32 22 30 20 28 20 Z'; // body

const SILHOUETTE_WIDTH = 34;
const SILHOUETTE_HEIGHT = 60;
const DISPLAY_HEIGHT = 70;
const DISPLAY_WIDTH = (SILHOUETTE_WIDTH / SILHOUETTE_HEIGHT) * DISPLAY_HEIGHT;

// Minimum fill starts at ~knee level (about 75% from top = 25% fill visually)
const MIN_FILL_RATIO = 0.20;

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function interpolateColor(progress: number): string {
  // 0% = dim red, 50% = yellow-ish, 100% = green
  const r = progress < 0.5 ? 200 : 200 - (progress - 0.5) * 2 * 160;
  const g = progress < 0.5 ? 60 + progress * 2 * 140 : 200;
  const b = 50 + progress * 30;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getGlowColor(progress: number): string {
  const r = progress < 0.5 ? 180 : 180 - (progress - 0.5) * 2 * 140;
  const g = progress < 0.5 ? 40 + progress * 2 * 120 : 160;
  const b = 40 + progress * 20;
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.15)`;
}

export default function WaterWidget({ todayTotal, goal, onAdd, onUndo }: WaterWidgetProps) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const rawProgress = goal > 0 ? Math.min(todayTotal / goal, 1) : 0;

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: rawProgress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [rawProgress]);

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

  const goalReached = todayTotal >= goal;
  const fillColor = interpolateColor(rawProgress);
  const glowBg = getGlowColor(rawProgress);

  // Effective fill: even at 0% we show knees level (MIN_FILL_RATIO), then scales up
  const effectiveFill = MIN_FILL_RATIO + rawProgress * (1 - MIN_FILL_RATIO);
  // Fill from bottom: clipY = totalHeight * (1 - effectiveFill)
  const clipY = SILHOUETTE_HEIGHT * (1 - effectiveFill);

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
          {/* Human silhouette with water fill */}
          <View style={[styles.silhouetteWrap, { backgroundColor: glowBg }]}>
            <Svg
              width={DISPLAY_WIDTH}
              height={DISPLAY_HEIGHT}
              viewBox={`0 0 ${SILHOUETTE_WIDTH} ${SILHOUETTE_HEIGHT}`}
            >
              <Defs>
                <ClipPath id="bodyClip">
                  <Path d={BODY_PATH} />
                </ClipPath>
              </Defs>
              {/* Unfilled body (dim outline) */}
              <Path
                d={BODY_PATH}
                fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              />
              {/* Filled portion - clipped to body */}
              <Rect
                x={0}
                y={clipY}
                width={SILHOUETTE_WIDTH}
                height={SILHOUETTE_HEIGHT - clipY}
                fill={fillColor}
                clipPath="url(#bodyClip)"
                opacity={0.7}
              />
            </Svg>
          </View>

          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{t('water_title')}</Text>
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              <Text style={{ color: fillColor, fontWeight: '700' }}>{todayTotal}</Text> {t('water_of')} {goal} {t('water_ml')}
            </Text>
            <Text style={[styles.percentText, { color: fillColor }]}>
              {Math.round(rawProgress * 100)}%
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
                style={[styles.addBtn, { backgroundColor: `${fillColor}15` }]}
                onPress={() => handleAdd(ml)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${t('add')} ${ml} ${t('water_ml')}`}
              >
                <Text style={[styles.addBtnText, { color: fillColor }]}>+{ml}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom input */}
          <View style={styles.customRow}>
            <View style={[styles.customInput, { backgroundColor: `${fillColor}10`, borderColor: colors.border }]}>
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
              style={[styles.customAddBtn, { backgroundColor: fillColor }]}
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
    gap: SPACING.sm + 4,
  },
  silhouetteWrap: {
    width: 50,
    height: 74,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  percentText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 2,
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
