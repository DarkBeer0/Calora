import { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { MealEntry } from '../types';

interface MealCardProps {
  meal: MealEntry;
  onDelete?: (id: string) => void;
  onPress?: (meal: MealEntry) => void;
  onLongPress?: (meal: MealEntry) => void;
}

function MealCardInner({ meal, onDelete, onPress, onLongPress }: MealCardProps) {
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const swipeableRef = useRef<Swipeable>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete?.(meal.id);
    });
  };

  const renderRightActions = () => (
    <TouchableOpacity style={[styles.swipeAction, { backgroundColor: colors.error }]} onPress={handleDelete} accessibilityRole="button" accessibilityLabel={t('delete')}>
      <Ionicons name="trash-outline" size={22} color={colors.onError} />
      <Text style={[styles.swipeActionText, { color: colors.onError }]}>{t('delete')}</Text>
    </TouchableOpacity>
  );

  const cardInner = (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{meal.foodItem.name}</Text>
        <Text style={[styles.grams, { color: colors.textSecondary }]}>{meal.grams}{t('g')}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.calories, { color: colors.calories }]}>{meal.calories}</Text>
        <Text style={[styles.kcalLabel, { color: colors.textSecondary }]}>{t('kcal')}</Text>
      </View>
      <View style={[styles.macros, { borderTopColor: tint(colors.border, 0.5) }]}>
        <Text style={[styles.macroText, { color: colors.textSecondary }]}>{t('dash_protein_short' as any)} {meal.protein}</Text>
        <Text style={[styles.macroDot, { color: colors.border }]}>·</Text>
        <Text style={[styles.macroText, { color: colors.textSecondary }]}>{t('dash_fat_short' as any)} {meal.fat}</Text>
        <Text style={[styles.macroDot, { color: colors.border }]}>·</Text>
        <Text style={[styles.macroText, { color: colors.textSecondary }]}>{t('dash_carbs_short' as any)} {meal.carbs}</Text>
      </View>
    </View>
  );

  const cardContent = (onPress || onLongPress) ? (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress ? () => onPress(meal) : undefined}
      onLongPress={onLongPress ? () => onLongPress(meal) : undefined}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${meal.foodItem.name}, ${meal.calories} ${t('kcal')}`}
    >
      {cardInner}
    </TouchableOpacity>
  ) : cardInner;

  if (!onDelete) {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {cardContent}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
        {cardContent}
      </Swipeable>
    </Animated.View>
  );
}

const MealCard = memo(MealCardInner);
export default MealCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  left: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  grams: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  calories: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kcalLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  macroText: {
    fontSize: 11,
    fontWeight: '500',
  },
  macroDot: {
    fontSize: 11,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: SPACING.sm,
    borderRadius: 14,
    marginLeft: SPACING.xs,
  },
  swipeActionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
