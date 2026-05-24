import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import CustomAlert from '../components/CustomAlert';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function SupportScreen() {
  const { colors, tint } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const version = (Constants.expoConfig?.version ?? '1.0.1');

  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: '',
  });

  const showSoon = (title: string, message: string) => setAlert({ visible: true, title, message });

  const rows = [
    {
      key: 'contact',
      icon: 'chatbubble-ellipses' as const,
      color: colors.primary,
      label: t('support_contact'),
      desc: t('support_contact_desc'),
      onPress: () => navigation.navigate('Feedback'),
    },
    {
      key: 'rate',
      icon: 'star' as const,
      color: colors.favorite,
      label: t('support_rate'),
      desc: t('support_rate_desc'),
      onPress: () => showSoon(t('support_rate'), t('support_rate_soon')),
    },
    {
      key: 'privacy',
      icon: 'shield-checkmark' as const,
      color: colors.water,
      label: t('support_privacy'),
      desc: t('support_privacy_desc'),
      onPress: () => showSoon(t('support_privacy'), t('support_privacy_soon')),
    },
  ];

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {/* Action rows */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {rows.map((r, idx) => (
          <View key={r.key}>
            <TouchableOpacity style={styles.row} onPress={r.onPress} activeOpacity={0.7}>
              <View style={[styles.iconBadge, { backgroundColor: tint(r.color, 0.12) }]}>
                <Ionicons name={r.icon} size={18} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { color: colors.text }]}>{r.label}</Text>
                <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>{r.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {idx < rows.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </View>

      {/* About card */}
      <View style={[styles.aboutCard, { backgroundColor: tint(colors.primary, 0.06), borderColor: tint(colors.primary, 0.15) }]}>
        <View style={[styles.aboutLogo, { backgroundColor: colors.primary }]}>
          <Ionicons name="leaf" size={20} color="#fff" />
        </View>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>{t('support_about')}</Text>
        <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>{t('support_about_desc')}</Text>
        <View style={[styles.versionPill, { backgroundColor: tint(colors.primary, 0.12) }]}>
          <Text style={[styles.versionText, { color: colors.primary }]}>{t('support_version')} {version}</Text>
        </View>
      </View>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        icon="information-circle"
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: SPACING.md },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  iconBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  rowSubtext: { fontSize: 11, marginTop: 2 },
  divider: { height: 1 },

  aboutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  aboutLogo: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  aboutTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.xs },
  aboutDesc: { fontSize: FONT_SIZE.xs, textAlign: 'center', lineHeight: 18, marginBottom: SPACING.md },
  versionPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  versionText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
});
