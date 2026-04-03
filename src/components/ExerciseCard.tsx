import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { ExerciseEntry } from '../types';

interface ExerciseCardProps {
  exercise: ExerciseEntry;
  icon?: string;
  onDelete?: (id: string) => void;
}

export default function ExerciseCard({ exercise, icon, onDelete }: ExerciseCardProps) {
  const { colors, isDark } = useTheme();
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
      onDelete?.(exercise.id);
    });
  };

  const renderRightActions = () => (
    <TouchableOpacity style={[styles.swipeAction, { backgroundColor: colors.error }]} onPress={handleDelete}>
      <Ionicons name="trash-outline" size={20} color="#fff" />
      <Text style={styles.swipeActionText}>{t('delete')}</Text>
    </TouchableOpacity>
  );

  const cardContent = (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(239,83,80,0.15)' : '#FFF0ED' }]}>
        <Ionicons name={(icon as any) || 'fitness'} size={20} color={colors.error} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{exercise.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{exercise.durationMin} {t('min')}</Text>
      </View>
      <Text style={[styles.burned, { color: colors.error }]}>-{exercise.caloriesBurned} {t('kcal')}</Text>
    </View>
  );

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
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  meta: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  burned: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: SPACING.xs,
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
