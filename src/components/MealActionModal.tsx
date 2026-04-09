import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { MealEntry } from '../types';

interface MealActionModalProps {
  visible: boolean;
  meal: MealEntry | null;
  onEdit: (meal: MealEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function MealActionModal({ visible, meal, onEdit, onDelete, onClose }: MealActionModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      overlayAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!meal) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim }]} />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            transform: [{ scale: scaleAnim }],
            opacity: scaleAnim,
          },
        ]}>
          {/* Food info header */}
          <View style={styles.foodInfo}>
            <View style={[styles.foodIcon, { backgroundColor: `${colors.calories}15` }]}>
              <Ionicons name="restaurant" size={20} color={colors.calories} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{meal.foodItem.name}</Text>
              <Text style={[styles.foodMeta, { color: colors.textSecondary }]}>
                {meal.grams}{t('g')} · <Text style={{ color: colors.calories, fontWeight: '600' }}>{meal.calories} {t('kcal')}</Text>
              </Text>
            </View>
          </View>

          {/* Mini macros */}
          <View style={[styles.macroRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('dash_protein')}</Text>
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.protein}{t('g')}</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('dash_fat')}</Text>
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.fat}{t('g')}</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('dash_carbs')}</Text>
              <Text style={[styles.macroValue, { color: colors.text }]}>{meal.carbs}{t('g')}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(66,165,245,0.1)' : '#E3F2FD' }]}
              onPress={() => { handleClose(); setTimeout(() => onEdit(meal), 200); }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#42A5F5" />
              <Text style={[styles.actionText, { color: '#42A5F5' }]}>{t('edit_meal')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239,83,80,0.1)' : '#FFEBEE' }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                handleClose();
                setTimeout(() => onDelete(meal.id), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: SPACING.lg,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  foodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  foodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  foodMeta: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: 2,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  actions: {
    gap: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
