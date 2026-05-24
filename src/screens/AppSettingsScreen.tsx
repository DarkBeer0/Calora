import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n, LANGUAGE_LABELS } from '../i18n';
import { useNotifications } from '../hooks/useNotifications';
import type { Language } from '../i18n';

const LANGUAGE_KEYS: Language[] = ['ru', 'en', 'pl'];

export default function AppSettingsScreen() {
  const { colors, isDark, toggle: toggleTheme, tint } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { settings: notifSettings, toggleSetting: toggleNotif, isSupported: notifSupported } = useNotifications();

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {/* Appearance */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('app_settings_appearance')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.row} onPress={toggleTheme} activeOpacity={0.7}>
          <View style={[styles.iconBadge, { backgroundColor: tint(colors.primary, 0.12) }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowText, { color: colors.text }]}>
            {isDark ? t('profile_theme_dark') : t('profile_theme_light')}
          </Text>
          <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Locale / Language */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('app_settings_locale')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: tint(colors.primary, 0.12) }]}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowText, { color: colors.text }]}>{t('profile_language')}</Text>
        </View>
        <View style={styles.langRow}>
          {LANGUAGE_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.langBtn, { backgroundColor: lang === key ? colors.primary : tint(colors.text, 0.04) }]}
              onPress={() => setLang(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, { color: lang === key ? '#fff' : colors.text }]}>
                {LANGUAGE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications — always expanded on this screen */}
      {notifSupported && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('notif_section')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {([
              { key: 'meals' as const, icon: 'restaurant', label: t('notif_meals'), desc: t('notif_meals_desc') },
              { key: 'water' as const, icon: 'water', label: t('notif_water'), desc: t('notif_water_desc') },
              { key: 'summary' as const, icon: 'stats-chart', label: t('notif_summary'), desc: t('notif_summary_desc') },
            ]).map((item, idx, arr) => {
              const enabled = notifSettings[item.key];
              return (
                <View key={item.key}>
                  <TouchableOpacity
                    style={styles.notifRow}
                    onPress={() => toggleNotif(item.key, {
                      notif_breakfast_title: t('notif_breakfast_title'), notif_breakfast_body: t('notif_breakfast_body'),
                      notif_lunch_title: t('notif_lunch_title'), notif_lunch_body: t('notif_lunch_body'),
                      notif_dinner_title: t('notif_dinner_title'), notif_dinner_body: t('notif_dinner_body'),
                      notif_water_title: t('notif_water_title'), notif_water_body: t('notif_water_body'),
                      notif_summary_title: t('notif_summary_title'), notif_summary_body: t('notif_summary_body'),
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: tint(enabled ? colors.primary : colors.textSecondary, 0.12) }]}>
                      <Ionicons name={item.icon as any} size={18} color={enabled ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowText, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                    <View style={[styles.toggle, { backgroundColor: enabled ? colors.primary : tint(colors.text, 0.1) }]}>
                      <View style={[styles.toggleKnob, { transform: [{ translateX: enabled ? 16 : 2 }] }]} />
                    </View>
                  </TouchableOpacity>
                  {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              );
            })}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingTop: SPACING.md },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
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
  rowText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  rowSubtext: { fontSize: 11, marginTop: 2 },
  langRow: { flexDirection: 'row', gap: SPACING.xs, paddingBottom: SPACING.md },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  langText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  divider: { height: 1 },
  toggle: {
    width: 36, height: 20, borderRadius: 10,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#fff',
  },
});
