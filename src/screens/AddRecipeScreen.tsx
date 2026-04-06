import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useDebounce } from '../hooks/useDebounce';
import { useRecipes, computeRecipeNutrition } from '../hooks/useRecipes';
import { searchProducts } from '../services/openfoodfacts';
import type { FoodItem, RecipeIngredient, Recipe } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddRecipeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const { addRecipe, updateRecipe, deleteRecipe } = useRecipes();

  const editRecipe: Recipe | undefined = route.params?.editRecipe;

  const [name, setName] = useState(editRecipe?.name ?? '');
  const [servings, setServings] = useState(String(editRecipe?.servings ?? 1));
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(editRecipe?.ingredients ?? []);

  // Ingredient search state
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [gramsInput, setGramsInput] = useState('100');

  const debouncedQuery = useDebounce(query.trim(), 500);

  useEffect(() => {
    if (!debouncedQuery) { setResults([]); return; }
    let cancelled = false;
    setIsSearching(true);
    searchProducts(debouncedQuery)
      .then((items) => { if (!cancelled) setResults(items); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleAddIngredient = () => {
    if (!selectedFood) return;
    const grams = parseFloat(gramsInput.replace(',', '.')) || 100;
    setIngredients((prev) => [...prev, { foodItem: selectedFood, grams }]);
    setSelectedFood(null);
    setQuery('');
    setResults([]);
    setGramsInput('100');
    setSearchMode(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const nutrition = computeRecipeNutrition(ingredients);
  const servingsNum = parseInt(servings, 10) || 1;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('recipe_name'));
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert(t('error'), t('recipe_no_ingredients'));
      return;
    }

    const recipe: Recipe = {
      id: editRecipe?.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      ingredients,
      servings: servingsNum,
      ...nutrition,
      createdAt: editRecipe?.createdAt ?? new Date().toISOString(),
    };

    if (editRecipe) {
      updateRecipe(recipe);
    } else {
      addRecipe(recipe);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editRecipe) return;
    Alert.alert(t('recipe_delete'), t('recipe_delete_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: () => {
          deleteRecipe(editRecipe.id);
          navigation.goBack();
        }
      },
    ]);
  };

  const r1 = (v: number) => Math.round(v * 10) / 10;

  // Ingredient search modal
  if (searchMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => { setSearchMode(false); setSelectedFood(null); setQuery(''); }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('recipe_search_ingredient')}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* If food selected, show grams input */}
        {selectedFood ? (
          <View style={[styles.gramsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={2}>{selectedFood.name}</Text>
            <Text style={[styles.selectedKcal, { color: colors.textSecondary }]}>{selectedFood.caloriesPer100g} kcal/100g</Text>
            <View style={styles.gramsRow}>
              <TextInput
                style={[styles.gramsInput, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                value={gramsInput}
                onChangeText={setGramsInput}
                keyboardType="decimal-pad"
                maxLength={6}
                autoFocus
              />
              <Text style={[styles.gramsLabel, { color: colors.textSecondary }]}>g</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAddIngredient}>
                <Ionicons name="add" size={22} color="#fff" />
                <Text style={styles.addBtnText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isSearching ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.foodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setSelectedFood(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.foodKcal, { color: colors.textSecondary }]}>{item.caloriesPer100g} kcal/100g</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // Main recipe builder view
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recipe name */}
        <View style={[styles.fieldWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.nameInput, { color: colors.text }]}
            placeholder={t('recipe_name')}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Servings */}
        <View style={styles.servingsRow}>
          <Text style={[styles.servingsLabel, { color: colors.text }]}>{t('recipe_servings')}</Text>
          <View style={styles.servingsBtns}>
            <TouchableOpacity
              style={[styles.servingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setServings(String(Math.max(1, servingsNum - 1)))}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.servingsInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              maxLength={2}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.servingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setServings(String(servingsNum + 1))}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredients list */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe_ingredients')}</Text>
          <TouchableOpacity
            style={[styles.addIngredientBtn, { backgroundColor: colors.primary }]}
            onPress={() => setSearchMode(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addIngredientText}>{t('recipe_add_ingredient')}</Text>
          </TouchableOpacity>
        </View>

        {ingredients.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Ionicons name="list-outline" size={32} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('recipe_no_ingredients')}</Text>
          </View>
        ) : (
          ingredients.map((ing, idx) => {
            const m = ing.grams / 100;
            const kcal = Math.round(ing.foodItem.caloriesPer100g * m);
            return (
              <View key={idx} style={[styles.ingredientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ingredientName, { color: colors.text }]} numberOfLines={1}>{ing.foodItem.name}</Text>
                  <Text style={[styles.ingredientDetail, { color: colors.textSecondary }]}>
                    {ing.grams}g — {kcal} kcal
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveIngredient(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Nutrition summary */}
        {ingredients.length > 0 && (
          <View style={[styles.nutritionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.nutritionTitle, { color: colors.text }]}>{t('recipe_per_serving')}</Text>
            <View style={styles.nutritionRow}>
              <NutriBadge label="kcal" value={r1(nutrition.totalCalories / servingsNum)} color={colors.calories} sub={colors.textSecondary} />
              <NutriBadge label="P" value={r1(nutrition.totalProtein / servingsNum)} color={colors.protein} sub={colors.textSecondary} />
              <NutriBadge label="F" value={r1(nutrition.totalFat / servingsNum)} color={colors.fat} sub={colors.textSecondary} />
              <NutriBadge label="C" value={r1(nutrition.totalCarbs / servingsNum)} color={colors.carbs} sub={colors.textSecondary} />
            </View>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{t('recipe_save')}</Text>
        </TouchableOpacity>

        {/* Delete (edit mode only) */}
        {editRecipe && (
          <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.error }]} onPress={handleDelete}>
            <Text style={[styles.deleteBtnText, { color: colors.error }]}>{t('recipe_delete')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NutriBadge({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  return (
    <View style={nutStyles.badge}>
      <Text style={[nutStyles.value, { color }]}>{value}</Text>
      <Text style={[nutStyles.label, { color: sub }]}>{label}</Text>
    </View>
  );
}

const nutStyles = StyleSheet.create({
  badge: { alignItems: 'center', flex: 1 },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.lg },

  fieldWrapper: { borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.sm, marginBottom: SPACING.md },
  nameInput: { fontSize: FONT_SIZE.lg, fontWeight: '600', paddingVertical: SPACING.md },

  servingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  servingsLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  servingsBtns: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  servingsBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  servingsInput: { width: 48, height: 36, borderRadius: 10, borderWidth: 1, fontSize: FONT_SIZE.md, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  addIngredientBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 10 },
  addIngredientText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingVertical: SPACING.xl, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm },

  ingredientCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.xs, borderWidth: 1,
  },
  ingredientName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  ingredientDetail: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  nutritionCard: { borderRadius: 16, borderWidth: 1, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.lg },
  nutritionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  nutritionRow: { flexDirection: 'row' },

  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  deleteBtn: { marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  deleteBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Search mode styles
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: SPACING.sm, gap: SPACING.xs },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  foodCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1 },
  foodName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  foodKcal: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  gramsCard: { margin: SPACING.md, borderRadius: 16, borderWidth: 1, padding: SPACING.lg },
  selectedName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  selectedKcal: { fontSize: FONT_SIZE.sm, marginTop: 4, marginBottom: SPACING.md },
  gramsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  gramsInput: { width: 80, fontSize: FONT_SIZE.lg, fontWeight: '600', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: 12, borderWidth: 1 },
  gramsLabel: { fontSize: FONT_SIZE.md },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
