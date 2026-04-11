import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

  const resolvedButtons = buttons ?? [{ text: 'OK', onPress: onDismiss }];
  const iconName = icon ?? (title.toLowerCase().includes('ошибка') || title.toLowerCase().includes('error') || title.toLowerCase().includes('błąd') ? 'alert-circle' : 'checkmark-circle');
  const iconColor = iconName === 'alert-circle' || iconName === 'warning' ? colors.error : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: tint(iconColor, 0.1) }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Buttons */}
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
                  onPress={() => {
                    btn.onPress?.();
                    onDismiss?.();
                  }}
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    elevation: 10,
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
