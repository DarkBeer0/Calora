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
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { FoodItem } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddCustomFood'>;

interface Field {
  key: string;
  label: string;
  placeholder: string;
  numeric?: boolean;
}

const FIELDS: Field[] = [
  { key: 'name', label: 'Название продукта', placeholder: 'Например: Овсянка домашняя' },
  { key: 'calories', label: 'Калории (на 100г)', placeholder: '0', numeric: true },
  { key: 'protein', label: 'Белки, г', placeholder: '0', numeric: true },
  { key: 'fat', label: 'Жиры, г', placeholder: '0', numeric: true },
  { key: 'carbs', label: 'Углеводы, г', placeholder: '0', numeric: true },
  { key: 'fiber', label: 'Клетчатка, г', placeholder: '0', numeric: true },
  { key: 'sugars', label: 'Сахар, г', placeholder: '0', numeric: true },
  { key: 'saturatedFat', label: 'Насыщ. жиры, г', placeholder: '0', numeric: true },
  { key: 'salt', label: 'Соль, г', placeholder: '0', numeric: true },
];

export default function AddCustomFoodScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const barcode = route.params?.barcode;

  const [values, setValues] = useState<Record<string, string>>({ name: '' });

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const name = values.name?.trim();
    if (!name) {
      Alert.alert('Ошибка', 'Введите название продукта');
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {barcode && (
        <View style={styles.barcodeTag}>
          <Text style={styles.barcodeText}>Штрих-код: {barcode}</Text>
        </View>
      )}

      {FIELDS.map((f) => (
        <View key={f.key} style={styles.fieldWrap}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={values[f.key] || ''}
            onChangeText={(v) => setValue(f.key, v)}
            placeholder={f.placeholder}
            placeholderTextColor={COLORS.border}
            keyboardType={f.numeric ? 'numeric' : 'default'}
            maxLength={f.numeric ? 8 : 100}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Далее</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, paddingBottom: 40 },
  barcodeTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  barcodeText: { fontSize: FONT_SIZE.xs, color: COLORS.protein, fontWeight: '500' },
  fieldWrap: { marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
