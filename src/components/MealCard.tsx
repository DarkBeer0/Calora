import { useEffect, useRef } from 'react';
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
}

export default function MealCard({ meal, onDelete, onPress }: MealCardProps) {
  const { colors } = useTheme();
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
    <TouchableOpacity style={[styles.swipeAction, { backgroundColor: colors.error }]} onPress={handleDelete}>
      <Ionicons name="trash-outline" size={22} color="#fff" />
      <Text style={styles.swipeActionText}>{t('delete')}</Text>
    </TouchableOpacity>
  );

  const cardInner = (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{meal.foodItem.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{meal.grams}{t('g')} · {meal.calories} {t('kcal')}</Text>
      </View>
      <View style={styles.macros}>
        <Text style={[styles.macroText, { color: colors.protein }]}>P {meal.protein}</Text>
        <Text style={[styles.macroText, { color: colors.fat }]}>F {meal.fat}</Text>
        <Text style={[styles.macroText, { color: colors.carbs }]}>C {meal.carbs}</Text>
      </View>
    </View>
  );

  const cardContent = onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(meal)}>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  meta: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  macroText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
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
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
