import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { FoodItem } from '../types';
import type { TranslationKey } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddCustomFood'>;

interface Field {
  key: string;
  i18nKey: TranslationKey;
  numeric?: boolean;
}

const FIELDS: Field[] = [
  { key: 'name', i18nKey: 'custom_food_name' },
  { key: 'calories', i18nKey: 'custom_food_cal', numeric: true },
  { key: 'protein', i18nKey: 'custom_food_protein', numeric: true },
  { key: 'fat', i18nKey: 'custom_food_fat', numeric: true },
  { key: 'carbs', i18nKey: 'custom_food_carbs', numeric: true },
  { key: 'fiber', i18nKey: 'custom_food_fiber', numeric: true },
  { key: 'sugars', i18nKey: 'custom_food_sugars', numeric: true },
  { key: 'saturatedFat', i18nKey: 'custom_food_sat_fat', numeric: true },
  { key: 'salt', i18nKey: 'custom_food_salt', numeric: true },
];

export default function AddCustomFoodScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const barcode = route.params?.barcode;

  const [values, setValues] = useState<Record<string, string>>({ name: '' });

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const name = values.name?.trim();
    if (!name) {
      Alert.alert(t('error'), t('custom_food_error_name'));
      return;
    }

    const num = (key: string) => parseFloat(values[key] || '0') || 0;

    const food: FoodItem = {
      id: `custom_${Date.now()}`,
      name,
      caloriesPer100g: num('calories'),
      proteinPer100g: num('protein'),
      fatPer100g: num('fat'),
      carbsPer100g: num('carbs'),
      fiberPer100g: num('fiber'),
      sugarsPer100g: num('sugars'),
      saturatedFatPer100g: num('saturatedFat'),
      saltPer100g: num('salt'),
      barcode: barcode,
      source: 'custom',
    };

    navigation.replace('ConfirmMeal', { food });
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {barcode && (
        <View style={[styles.barcodeTag, { backgroundColor: isDark ? 'rgba(33,150,243,0.15)' : '#E3F2FD' }]}>
          <Text style={[styles.barcodeText, { color: colors.protein }]}>{t('custom_food_barcode')}: {barcode}</Text>
        </View>
      )}

      {FIELDS.map((f) => (
        <View key={f.key} style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.text }]}>{t(f.i18nKey)}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={values[f.key] || ''}
            onChangeText={(v) => setValue(f.key, v)}
            placeholder={f.key === 'name' ? t('custom_food_name_hint') : '0'}
            placeholderTextColor={colors.border}
            keyboardType={f.numeric ? 'numeric' : 'default'}
            maxLength={f.numeric ? 8 : 100}
          />
        </View>
      ))}

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>{t('next')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingBottom: 40 },
  barcodeTag: { borderRadius: 12, padding: SPACING.sm, marginBottom: SPACING.md },
  barcodeText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: SPACING.xs },
  input: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONT_SIZE.md,
  },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: SPACING.sm },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
