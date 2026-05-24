import { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZE } from '../constants/theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface Props {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  icon?: 'checkmark-circle' | 'alert-circle' | 'information-circle' | 'warning';
}

export default function CustomAlert({ visible, title, message, buttons, onDismiss, icon }: Props) {
  const { colors, tint } = useTheme();
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

  const handleClose = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb?.();
      onDismiss?.();
    });
  };

  const resolvedButtons = buttons ?? [{ text: 'OK', onPress: onDismiss }];
  const iconName = icon ?? (title.toLowerCase().includes('ошибка') || title.toLowerCase().includes('error') || title.toLowerCase().includes('błąd') ? 'alert-circle' : 'checkmark-circle');
  const iconColor = iconName === 'alert-circle' || iconName === 'warning' ? colors.error : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => handleClose()}>
      <Pressable style={styles.overlayPressable} onPress={() => handleClose()}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.overlay, opacity: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
          ]}
        />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: tint(iconColor, 0.1) }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.buttonRow}>
            {resolvedButtons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive && resolvedButtons.length > 1 ? i === resolvedButtons.length - 1 : !isCancel;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    isPrimary && !isDestructive && { backgroundColor: colors.primary },
                    isDestructive && { backgroundColor: colors.error },
                    isCancel && { backgroundColor: tint(colors.text, 0.06) },
                    resolvedButtons.length === 1 && { flex: 0, minWidth: 120 },
                  ]}
                  onPress={() => handleClose(() => btn.onPress?.())}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    (isPrimary || isDestructive) && { color: '#fff' },
                    isCancel && { color: colors.text },
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
