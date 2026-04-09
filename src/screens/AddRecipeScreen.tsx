import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useRecipes, computeRecipeNutrition, computeRecipeTotalWeight } from '../hooks/useRecipes';
import { analyzeFoodText, aiAnalysisToFoodItem, hasAIKey } from '../services/aiNutrition';
import type { RecipeIngredient, Recipe } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddRecipeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { addRecipe, updateRecipe, deleteRecipe } = useRecipes();

  const editRecipe: Recipe | undefined = route.params?.editRecipe;

  const [name, setName] = useState(editRecipe?.name ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(editRecipe?.ingredients ?? []);

  // Add ingredient mode
  const [addMode, setAddMode] = useState<'none' | 'ai'>('none');
  const [aiText, setAiText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetAddMode = () => {
    setAddMode('none');
    setAiText('');
  };

  // AI ingredient analysis
  const handleAIAdd = async () => {
    const text = aiText.trim();
    if (!text || isAnalyzing) return;
    if (!hasAIKey()) {
      Alert.alert(t('error'), t('ai_no_key'));
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFoodText(text, lang);
      const food = aiAnalysisToFoodItem(analysis);
      const grams = Math.round(analysis.totalGrams);

      setIngredients((prev) => [...prev, {
        foodItem: food,
        grams,
      }]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetAddMode();
    } catch (e: any) {
      Alert.alert(t('error'), String(e?.message || e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const nutrition = computeRecipeNutrition(ingredients);
  const totalWeight = computeRecipeTotalWeight(ingredients);

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
      servings: 1,
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

  // ---- Main recipe builder ----
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

        {/* Ingredients header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe_ingredients')}</Text>
        </View>

        {/* AI ingredient input */}
        {addMode === 'ai' ? (
          <View style={[styles.aiInputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aiInputRow}>
              <TextInput
                style={[styles.aiInput, { color: colors.text }]}
                placeholder={t('recipe_ai_placeholder')}
                placeholderTextColor={colors.textSecondary}
                value={aiText}
                onChangeText={setAiText}
                autoFocus
                multiline
                maxLength={200}
                onSubmitEditing={handleAIAdd}
                blurOnSubmit
                returnKeyType="send"
              />
            </View>
            <View style={styles.aiActions}>
              <TouchableOpacity onPress={resetAddMode} style={styles.aiCancelBtn}>
                <Text style={[styles.aiCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aiSendBtn, { backgroundColor: aiText.trim() && !isAnalyzing ? colors.primary : colors.border }]}
                onPress={handleAIAdd}
                disabled={!aiText.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#fff" />
                )}
                <Text style={styles.aiSendText}>
                  {isAnalyzing ? t('recipe_analyzing') : t('add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : addMode === 'none' ? (
          <View style={styles.addBtnsRow}>
            <TouchableOpacity
              style={[styles.addIngredientBtn, { backgroundColor: colors.primary }]}
              onPress={() => setAddMode('ai')}
            >
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.addIngredientText}>{t('recipe_ai_add')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Ingredients list */}
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
                    {ing.quantity ? `${ing.quantity} ${ing.unit || t('recipe_pcs')} · ` : ''}{ing.grams}g — {kcal} kcal
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
            <Text style={[styles.totalWeightText, { color: colors.textSecondary }]}>
              {t('recipe_total_weight')}: {Math.round(totalWeight)}g
            </Text>
            <View style={styles.nutritionRow}>
              <NutriBadge label="kcal" value={r1(nutrition.totalCalories)} color={colors.calories} sub={colors.textSecondary} />
              <NutriBadge label={t('dash_protein_short' as any)} value={r1(nutrition.totalProtein)} color={colors.protein} sub={colors.textSecondary} />
              <NutriBadge label={t('dash_fat_short' as any)} value={r1(nutrition.totalFat)} color={colors.fat} sub={colors.textSecondary} />
              <NutriBadge label={t('dash_carbs_short' as any)} value={r1(nutrition.totalCarbs)} color={colors.carbs} sub={colors.textSecondary} />
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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Add ingredient buttons
  addBtnsRow: { gap: SPACING.sm, marginBottom: SPACING.md },
  addIngredientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  addIngredientText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  // AI input
  aiInputCard: { borderRadius: 14, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.md },
  aiInputRow: { minHeight: 44 },
  aiInput: { fontSize: FONT_SIZE.sm, lineHeight: 20, padding: SPACING.xs },
  aiActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  aiCancelBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  aiCancelText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  aiSendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: SPACING.md, borderRadius: 10 },
  aiSendText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingVertical: SPACING.xl, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm },

  ingredientCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.xs, borderWidth: 1,
  },
  ingredientName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  ingredientDetail: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  nutritionCard: { borderRadius: 16, borderWidth: 1, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.lg },
  nutritionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  totalWeightText: { fontSize: FONT_SIZE.xs, textAlign: 'center', marginBottom: SPACING.sm },
  nutritionRow: { flexDirection: 'row' },

  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  deleteBtn: { marginTop: SPACING.sm, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  deleteBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
});
