import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { sendFeedback } from '../services/feedback';

export default function FeedbackScreen() {
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = message.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;

    setSending(true);
    try {
      await sendFeedback({
        message: message.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('done'), t('feedback_sent'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), t('feedback_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header info */}
        <View style={[styles.infoCard, { backgroundColor: tint(colors.primary, 0.06), borderColor: tint(colors.primary, 0.15) }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('feedback_description')}
          </Text>
        </View>

        {/* Name (optional) */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('feedback_name')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={name}
          onChangeText={setName}
          placeholder={t('feedback_name_placeholder')}
          placeholderTextColor={colors.textSecondary}
          maxLength={100}
          autoCapitalize="words"
        />

        {/* Email (optional) */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('feedback_email')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder={t('feedback_email_placeholder')}
          placeholderTextColor={colors.textSecondary}
          maxLength={200}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Message (required) */}
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('feedback_message')} *</Text>
          <Text style={[styles.counter, { color: message.length > 1800 ? colors.error : colors.textSecondary }]}>
            {message.length}/2000
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.messageInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder={t('feedback_message_placeholder')}
          placeholderTextColor={colors.textSecondary}
          maxLength={2000}
          multiline
          textAlignVertical="top"
        />

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? colors.primary : tint(colors.text, 0.1) },
          ]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!canSend}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>{t('feedback_send')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: SPACING.md },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  infoText: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },

  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  counter: { fontSize: 11 },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.sm,
  },
  messageInput: {
    minHeight: 140,
    maxHeight: 240,
  },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 50,
  },
  sendBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
