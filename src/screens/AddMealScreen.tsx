import { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { useFoods } from '../hooks/useFoods';
import { useMeals } from '../hooks/useMeals';
import { useRecipes, recipeToFoodItem, recipeServingGrams } from '../hooks/useRecipes';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFoodText, analyzeFoodImage, aiAnalysisToFoodItem, hasAIKey, type AIFoodAnalysis } from '../services/aiNutrition';
import { calculateNutrition, calculateDailyTarget } from '../utils/nutrition';
import { DAILY_MICRO_TARGETS } from '../constants/nutrition';
import { useProfile } from '../hooks/useProfile';
import type { FoodItem, MealEntry } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AIThinkingAnimation from '../components/AIThinkingAnimation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAILY_LIMIT = 10;
const LIMIT_STORAGE_KEY = 'calora_ai_daily';

type ChatMessage =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'ai'; food: FoodItem; analysis: AIFoodAnalysis; grams: number; added?: boolean; addedNutrition?: ReturnType<typeof calculateNutrition> }
  | { id: string; type: 'error'; text: string }
  | { id: string; type: 'browse' };

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMealTypeByTime(): MealEntry['mealType'] {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 19) return 'dinner';
  return 'snack';
}

export default function AddMealScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark, tint } = useTheme();
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { recentFoods, favoriteFoods, addRecent } = useFoods();
  const { addMeal, todaySummary } = useMeals();
  const { recipes } = useRecipes();
  const { profile } = useProfile();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'browse', type: 'browse' }]);
  const [usedToday, setUsedToday] = useState(0);
  const listRef = useRef<FlatList>(null);

  // Load daily usage
  useEffect(() => {
    AsyncStorage.getItem(LIMIT_STORAGE_KEY).then((raw) => {
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === todayKey()) {
          setUsedToday(data.count);
        }
      }
    });
  }, []);

  const incrementUsage = useCallback(async () => {
    const newCount = usedToday + 1;
    setUsedToday(newCount);
    await AsyncStorage.setItem(LIMIT_STORAGE_KEY, JSON.stringify({ date: todayKey(), count: newCount }));
  }, [usedToday]);

  const remaining = DAILY_LIMIT - usedToday;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    if (remaining <= 0) {
      Alert.alert(t('ai_limit_title'), t('ai_limit_msg'));
      return;
    }

    Haptics.selectionAsync();
    setMessages((prev) => [...prev, { id: uid(), type: 'user', text }]);
    setInput('');
    setIsThinking(true);
    scrollToEnd();

    try {
      if (!hasAIKey()) throw new Error(t('ai_no_key'));
      const analysis = await analyzeFoodText(text, lang);
      const food = aiAnalysisToFoodItem(analysis);
      setMessages((prev) => [...prev, {
        id: uid(), type: 'ai', food, analysis,
        grams: Math.round(analysis.totalGrams),
      }]);
      await incrementUsage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setMessages((prev) => [...prev, { id: uid(), type: 'error', text: msg }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsThinking(false);
      scrollToEnd();
    }
  }, [input, isThinking, remaining, lang, t, scrollToEnd, incrementUsage]);

  const handlePhoto = useCallback(async () => {
    if (isThinking) return;

    if (remaining <= 0) {
      Alert.alert(t('ai_limit_title'), t('ai_limit_msg'));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('ai_photo_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    Haptics.selectionAsync();
    setMessages((prev) => [...prev, { id: uid(), type: 'user', text: '📷 ' + t('ai_photo_sent') }]);
    setIsThinking(true);
    scrollToEnd();

    try {
      if (!hasAIKey()) throw new Error(t('ai_no_key'));
      const analysis = await analyzeFoodImage(result.assets[0].base64, lang);
      const food = aiAnalysisToFoodItem(analysis);
      setMessages((prev) => [...prev, {
        id: uid(), type: 'ai', food, analysis,
        grams: Math.round(analysis.totalGrams),
      }]);
      await incrementUsage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setMessages((prev) => [...prev, { id: uid(), type: 'error', text: msg }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsThinking(false);
      scrollToEnd();
    }
  }, [isThinking, remaining, lang, t, scrollToEnd, incrementUsage]);

  const handleCamera = useCallback(async () => {
    if (isThinking) return;

    if (remaining <= 0) {
      Alert.alert(t('ai_limit_title'), t('ai_limit_msg'));
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('ai_photo_permission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    Haptics.selectionAsync();
    setMessages((prev) => [...prev, { id: uid(), type: 'user', text: '📷 ' + t('ai_photo_sent') }]);
    setIsThinking(true);
    scrollToEnd();

    try {
      if (!hasAIKey()) throw new Error(t('ai_no_key'));
      const analysis = await analyzeFoodImage(result.assets[0].base64, lang);
      const food = aiAnalysisToFoodItem(analysis);
      setMessages((prev) => [...prev, {
        id: uid(), type: 'ai', food, analysis,
        grams: Math.round(analysis.totalGrams),
      }]);
      await incrementUsage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setMessages((prev) => [...prev, { id: uid(), type: 'error', text: msg }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsThinking(false);
      scrollToEnd();
    }
  }, [isThinking, remaining, lang, t, scrollToEnd, incrementUsage]);

  const updateGrams = useCallback((msgId: string, newGrams: number) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId && m.type === 'ai' ? { ...m, grams: newGrams } : m
    ));
  }, []);

  const handleDirectAdd = useCallback((msg: Extract<ChatMessage, { type: 'ai' }>) => {
    const { food, grams } = msg;
    const nutrition = calculateNutrition(food, grams);
    const entry: MealEntry = {
      id: Date.now().toString(),
      userId: '1',
      date: todayKey(),
      mealType: getMealTypeByTime(),
      foodItem: food,
      grams,
      ...nutrition,
      createdAt: new Date().toISOString(),
    };
    addMeal(entry);
    addRecent(food);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setMessages((prev) => prev.map((m) =>
      m.id === msg.id && m.type === 'ai' ? { ...m, added: true, addedNutrition: nutrition } : m
    ));
  }, [addMeal, addRecent]);

  // ---- Renderers ----

  const renderUser = (m: Extract<ChatMessage, { type: 'user' }>) => (
    <View style={[styles.userBubble, { backgroundColor: tint(colors.text, 0.06) }]}>
      <Text style={[styles.userText, { color: colors.text }]}>{m.text}</Text>
    </View>
  );

  const renderError = (m: Extract<ChatMessage, { type: 'error' }>) => (
    <View style={[styles.errorBubble, { backgroundColor: tint(colors.error, 0.08) }]}>
      <Ionicons name="alert-circle" size={16} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={3}>{m.text}</Text>
    </View>
  );

  const renderAI = (m: Extract<ChatMessage, { type: 'ai' }>) => {
    const { food, analysis, grams, added, addedNutrition } = m;
    const totalKcal = Math.round((food.caloriesPer100g * grams) / 100);
    const totalP = Math.round((food.proteinPer100g * grams) / 10) / 10;
    const totalF = Math.round((food.fatPer100g * grams) / 10) / 10;
    const totalC = Math.round((food.carbsPer100g * grams) / 10) / 10;

    if (added) {
      const dailyTarget = calculateDailyTarget(profile);
      const nut = addedNutrition || calculateNutrition(food, grams);
      // Show summary of how this meal affected daily totals
      const totalCals = todaySummary.totalCalories;
      const calPct = dailyTarget.calories > 0 ? Math.min(totalCals / dailyTarget.calories, 1) : 0;
      const isOverCal = totalCals > dailyTarget.calories;

      const pPct = dailyTarget.protein > 0 ? Math.min(todaySummary.totalProtein / dailyTarget.protein, 1) : 0;
      const fPct = dailyTarget.fat > 0 ? Math.min(todaySummary.totalFat / dailyTarget.fat, 1) : 0;
      const cPct = dailyTarget.carbs > 0 ? Math.min(todaySummary.totalCarbs / dailyTarget.carbs, 1) : 0;

      return (
        <View style={[styles.addedCard, { backgroundColor: tint(colors.primary, 0.06) }]}>
          <View style={styles.addedHeader}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.addedText, { color: colors.primary }]}>
              {food.name} · +{nut.calories} {t('kcal')}
            </Text>
          </View>
          {/* Mini daily progress */}
          <View style={styles.addedProgress}>
            <View style={styles.addedBarRow}>
              <Text style={[styles.addedBarLabel, { color: isOverCal ? colors.error : colors.textSecondary }]}>
                {Math.round(totalCals)}/{dailyTarget.calories} {t('kcal')}
              </Text>
              <View style={[styles.addedBarBg, { backgroundColor: `${colors.calories}15` }]}>
                <View style={[styles.addedBarFill, { width: `${calPct * 100}%`, backgroundColor: isOverCal ? colors.error : colors.calories }]} />
              </View>
            </View>
            <View style={styles.addedMacroRow}>
              <View style={styles.addedMiniBar}>
                <Text style={[styles.addedMiniLabel, { color: colors.protein }]}>{t('dash_protein_short' as any)}</Text>
                <View style={[styles.addedMiniBarBg, { backgroundColor: `${colors.protein}20` }]}>
                  <View style={[styles.addedMiniBarFill, { width: `${pPct * 100}%`, backgroundColor: colors.protein }]} />
                </View>
              </View>
              <View style={styles.addedMiniBar}>
                <Text style={[styles.addedMiniLabel, { color: colors.fat }]}>{t('dash_fat_short' as any)}</Text>
                <View style={[styles.addedMiniBarBg, { backgroundColor: `${colors.fat}20` }]}>
                  <View style={[styles.addedMiniBarFill, { width: `${fPct * 100}%`, backgroundColor: colors.fat }]} />
                </View>
              </View>
              <View style={styles.addedMiniBar}>
                <Text style={[styles.addedMiniLabel, { color: colors.carbs }]}>{t('dash_carbs_short' as any)}</Text>
                <View style={[styles.addedMiniBarBg, { backgroundColor: `${colors.carbs}20` }]}>
                  <View style={[styles.addedMiniBarFill, { width: `${cPct * 100}%`, backgroundColor: colors.carbs }]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Name + calories hero */}
        <Text style={[styles.aiName, { color: colors.text }]}>{food.name}</Text>

        <View style={styles.kcalRow}>
          <Text style={[styles.kcalValue, { color: colors.text }]}>{totalKcal}</Text>
          <Text style={[styles.kcalLabel, { color: colors.textSecondary }]}>{t('kcal')}</Text>
        </View>

        {/* Editable grams */}
        <View style={[styles.gramsRow, { backgroundColor: tint(colors.text, 0.04) }]}>
          <Ionicons name="scale-outline" size={14} color={colors.textSecondary} />
          <TextInput
            style={[styles.gramsInput, { color: colors.text }]}
            value={String(grams)}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 0 && n <= 9999) updateGrams(m.id, n);
              else if (v === '') updateGrams(m.id, 0);
            }}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
          />
          <Text style={[styles.gramsUnit, { color: colors.textSecondary }]}>{t('g')}</Text>
        </View>

        {/* Macros - subtle */}
        <View style={styles.macrosRow}>
          <Text style={[styles.macroItem, { color: colors.textSecondary }]}>
            {t('dash_protein_short' as any)} {totalP}{t('g')}
          </Text>
          <Text style={[styles.macroDot, { color: colors.border }]}>·</Text>
          <Text style={[styles.macroItem, { color: colors.textSecondary }]}>
            {t('dash_fat_short' as any)} {totalF}{t('g')}
          </Text>
          <Text style={[styles.macroDot, { color: colors.border }]}>·</Text>
          <Text style={[styles.macroItem, { color: colors.textSecondary }]}>
            {t('dash_carbs_short' as any)} {totalC}{t('g')}
          </Text>
        </View>

        {/* Benefits - compact */}
        {analysis.benefits ? (
          <Text style={[styles.benefitsText, { color: colors.textSecondary }]}>
            {analysis.benefits}
          </Text>
        ) : null}

        {/* Add button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleDirectAdd(m)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{t('ai_add_to_today')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBrowse = () => {
    const recipeFoods = recipes.map((r) => ({ food: recipeToFoodItem(r), servingGrams: recipeServingGrams(r) }));
    const sections: { title: string; data: { food: FoodItem; servingGrams?: number }[] }[] = [];
    if (recipeFoods.length > 0) sections.push({ title: t('recipe_select'), data: recipeFoods.slice(0, 5) });
    if (favoriteFoods.length > 0) sections.push({ title: t('favorite_foods'), data: favoriteFoods.slice(0, 5).map((f) => ({ food: f })) });
    if (recentFoods.length > 0) sections.push({ title: t('recent_foods'), data: recentFoods.slice(0, 5).map((f) => ({ food: f })) });

    return (
      <View style={styles.browseWrap}>
        {/* Compact welcome */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('ai_welcome_title')}</Text>

          {/* Horizontal example chips */}
          <View style={styles.examplesRow}>
            {[t('ai_example_1'), t('ai_example_2')].map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[styles.exampleChip, { borderColor: colors.border }]}
                onPress={() => setInput(ex)}
                activeOpacity={0.7}
              >
                <Text style={[styles.exampleText, { color: colors.textSecondary }]} numberOfLines={1}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick actions row */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('BarcodeScanner')}
            activeOpacity={0.7}
          >
            <Ionicons name="barcode-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.text }]}>{t('add_meal_barcode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Recipes')}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.text }]}>{t('recipe_select')}</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={{ marginTop: SPACING.sm }}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>{section.title}</Text>
            {section.data.map((item) => (
              <TouchableOpacity
                key={item.food.id}
                style={[styles.foodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('ConfirmMeal', { food: item.food, initialGrams: item.servingGrams })}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>{item.food.name}</Text>
                  <Text style={[styles.foodKcal, { color: colors.textSecondary }]}>{item.food.caloriesPer100g} {t('add_meal_per100g')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'browse') return renderBrowse();
    if (item.type === 'user') return renderUser(item);
    if (item.type === 'ai') return renderAI(item);
    if (item.type === 'error') return renderError(item);
    return null;
  };

  // Counter color: green → yellow → red
  const counterColor = remaining > 5 ? colors.primary
    : remaining > 2 ? colors.warning : colors.error;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {isThinking && <AIThinkingAnimation />}

      {/* Input bar + counter */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.border }]}
            onPress={handleCamera}
            disabled={isThinking || remaining <= 0}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={20} color={!isThinking && remaining > 0 ? colors.textSecondary : colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.border }]}
            onPress={handlePhoto}
            disabled={isThinking || remaining <= 0}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color={!isThinking && remaining > 0 ? colors.textSecondary : colors.border} />
          </TouchableOpacity>
          <View style={[styles.inputWrap, { backgroundColor: tint(colors.text, 0.04), borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('ai_chat_placeholder')}
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={300}
              editable={!isThinking}
              onSubmitEditing={handleSend}
              blurOnSubmit
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() && !isThinking && remaining > 0 ? colors.primary : colors.border }]}
            onPress={handleSend}
            disabled={!input.trim() || isThinking || remaining <= 0}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.counterText, { color: counterColor }]}>
          {remaining}/{DAILY_LIMIT} {t('ai_requests_left')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: SPACING.md, paddingBottom: SPACING.sm },

  // Browse
  browseWrap: { gap: SPACING.xs },
  welcomeCard: {
    borderRadius: 16, borderWidth: 1, padding: SPACING.md, alignItems: 'center',
  },
  welcomeTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.xs, textAlign: 'center' },
  examplesRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, width: '100%' },
  exampleChip: {
    flex: 1, paddingVertical: 6, paddingHorizontal: SPACING.xs, borderRadius: 8, borderWidth: 1, alignItems: 'center',
  },
  exampleText: { fontSize: 11 },
  quickActions: { flexDirection: 'row', gap: SPACING.xs },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  quickBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  sectionHeader: { fontSize: FONT_SIZE.xs, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  foodCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1, padding: SPACING.sm, marginBottom: 4,
  },
  foodName: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  foodKcal: { fontSize: FONT_SIZE.xs, marginTop: 1 },

  // User bubble
  userBubble: {
    alignSelf: 'flex-end', maxWidth: '80%',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 16, borderBottomRightRadius: 4, marginVertical: 4,
  },
  userText: { fontSize: FONT_SIZE.sm, lineHeight: 20 },

  // Error
  errorBubble: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderRadius: 12, padding: SPACING.sm, marginVertical: 4,
  },
  errorText: { flex: 1, fontSize: FONT_SIZE.xs },

  // AI card — clean
  aiCard: {
    borderRadius: 16, borderWidth: 1, padding: SPACING.md, marginVertical: 4,
  },
  aiName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  kcalValue: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  kcalLabel: { fontSize: FONT_SIZE.sm },

  gramsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 6, marginTop: SPACING.sm,
  },
  gramsInput: { fontSize: FONT_SIZE.md, fontWeight: '600', minWidth: 40, padding: 0 },
  gramsUnit: { fontSize: FONT_SIZE.sm },

  macrosRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: SPACING.sm,
  },
  macroItem: { fontSize: FONT_SIZE.xs },
  macroDot: { fontSize: FONT_SIZE.xs },

  benefitsText: { fontSize: FONT_SIZE.xs, lineHeight: 16, marginTop: SPACING.sm },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: 10, marginTop: SPACING.sm,
  },
  addBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Added state
  addedCard: {
    borderRadius: 12, padding: SPACING.sm, marginVertical: 4,
  },
  addedHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
  },
  addedText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  addedProgress: {
    marginTop: 8,
    gap: 6,
  },
  addedBarRow: {
    gap: 3,
  },
  addedBarLabel: {
    fontSize: 10, fontWeight: '600',
  },
  addedBarBg: {
    height: 5, borderRadius: 3, overflow: 'hidden',
  },
  addedBarFill: {
    height: '100%', borderRadius: 3,
  },
  addedMacroRow: {
    flexDirection: 'row', gap: SPACING.sm,
  },
  addedMiniBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  addedMiniLabel: {
    fontSize: 10, fontWeight: '700', width: 10,
  },
  addedMiniBarBg: {
    flex: 1, height: 4, borderRadius: 2, overflow: 'hidden',
  },
  addedMiniBarFill: {
    height: '100%', borderRadius: 2,
  },

  // Input bar
  inputBar: {
    paddingHorizontal: SPACING.sm, paddingTop: SPACING.xs, borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.xs,
  },
  inputWrap: {
    flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: SPACING.md,
    minHeight: 40, maxHeight: 100, justifyContent: 'center',
  },
  textInput: {
    fontSize: FONT_SIZE.sm,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  photoBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  counterText: {
    fontSize: 10, fontWeight: '600', textAlign: 'center',
    marginTop: 4,
  },
});
