import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useDebounce } from '../hooks/useDebounce';
import { useFoods } from '../hooks/useFoods';
import { searchProducts } from '../services/openfoodfacts';
import type { FoodItem } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddMealScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { recentFoods, favoriteFoods } = useFoods();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), 500);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearched(true);

    searchProducts(debouncedQuery)
      .then((items) => { if (!cancelled) setResults(items); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = (food: FoodItem) => {
    navigation.navigate('ConfirmMeal', { food });
  };

  const renderFoodCard = (item: FoodItem) => (
    <TouchableOpacity
      style={[styles.foodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.foodKcal, { color: colors.textSecondary }]}>{item.caloriesPer100g} {t('add_meal_per100g')}</Text>
      </View>
      <View style={styles.foodMacros}>
        <Text style={[styles.macroChip, { color: colors.protein }]}>P {item.proteinPer100g}</Text>
        <Text style={[styles.macroChip, { color: colors.fat }]}>F {item.fatPer100g}</Text>
        <Text style={[styles.macroChip, { color: colors.carbs }]}>C {item.carbsPer100g}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.border} />
    </TouchableOpacity>
  );

  // Show recent/favorites when no query
  const showBrowse = !query.trim() && !searched;
  const sections = [];
  if (favoriteFoods.length > 0) {
    sections.push({ title: t('favorite_foods'), data: favoriteFoods });
  }
  if (recentFoods.length > 0) {
    sections.push({ title: t('recent_foods'), data: recentFoods });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('add_meal_search_placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('BarcodeScanner')}
        >
          <Ionicons name="barcode-outline" size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>{t('add_meal_barcode')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('AddCustomFood', {})}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>{t('add_meal_manual')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isSearching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.searchingText, { color: colors.textSecondary }]}>{t('add_meal_searching')}</Text>
        </View>
      ) : showBrowse ? (
        sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={[styles.sectionHeader, { color: colors.text }]}>{title}</Text>
            )}
            renderItem={({ item }) => renderFoodCard(item)}
          />
        ) : (
          <View style={styles.centered}>
            <Ionicons name="fast-food-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('add_meal_enter_name')}</Text>
          </View>
        )
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => renderFoodCard(item)}
        />
      ) : searched && !isSearching ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('add_meal_not_found')}</Text>
          <Text style={[styles.emptyHint, { color: colors.border }]}>{t('add_meal_try_other')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, borderRadius: 14, borderWidth: 1, paddingVertical: 10,
  },
  actionText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  searchRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.sm, gap: SPACING.xs,
  },
  input: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: 10 },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  sectionHeader: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: SPACING.md, marginBottom: SPACING.sm },
  foodCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1,
  },
  foodInfo: { flex: 1, marginRight: SPACING.sm },
  foodName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  foodKcal: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  foodMacros: { flexDirection: 'row', gap: SPACING.xs, marginRight: SPACING.sm },
  macroChip: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  searchingText: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm },
  emptyHint: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
});
