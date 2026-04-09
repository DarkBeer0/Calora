import { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useRecipes, recipeToFoodItem, recipeServingGrams } from '../hooks/useRecipes';
import type { Recipe } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RecipesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { recipes, refresh } = useRecipes();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleUseAsMeal = (recipe: Recipe) => {
    const food = recipeToFoodItem(recipe);
    const servingG = recipeServingGrams(recipe);
    navigation.navigate('ConfirmMeal', { food, initialGrams: servingG });
  };

  const handleEdit = (recipe: Recipe) => {
    navigation.navigate('AddRecipe', { editRecipe: recipe });
  };

  const r1 = (v: number) => Math.round(v * 10) / 10;

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const s = item.servings || 1;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.cardContent} onPress={() => handleUseAsMeal(item)} activeOpacity={0.7}>
          <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.recipeInfo, { color: colors.textSecondary }]}>
            {item.ingredients.length} {t('recipe_ingredients').toLowerCase()} · {s} {t('recipe_servings').toLowerCase()}
          </Text>
          <View style={styles.macroRow}>
            <Text style={[styles.macroChip, { color: colors.calories }]}>{r1(item.totalCalories / s)} kcal</Text>
            <Text style={[styles.macroChip, { color: colors.protein }]}>{t('dash_protein_short' as any)} {r1(item.totalProtein / s)}</Text>
            <Text style={[styles.macroChip, { color: colors.fat }]}>{t('dash_fat_short' as any)} {r1(item.totalFat / s)}</Text>
            <Text style={[styles.macroChip, { color: colors.carbs }]}>{t('dash_carbs_short' as any)} {r1(item.totalCarbs / s)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('recipes_title')}</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddRecipe', {})}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newBtnText}>{t('recipe_new')}</Text>
        </TouchableOpacity>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('recipe_empty')}</Text>
          <Text style={[styles.emptyHint, { color: colors.border }]}>{t('recipe_empty_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 12 },
  newBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: SPACING.sm, overflow: 'hidden' },
  cardContent: { flex: 1, padding: SPACING.md },
  recipeName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  recipeInfo: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  macroRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  macroChip: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  editBtn: { justifyContent: 'center', paddingHorizontal: SPACING.md },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm },
  emptyHint: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
});
