import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import type { FoodItem, Recipe } from '../types';

import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddMealScreen from '../screens/AddMealScreen';
import ConfirmMealScreen from '../screens/ConfirmMealScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import AddCustomFoodScreen from '../screens/AddCustomFoodScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import RecipesScreen from '../screens/RecipesScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';

export type RootStackParamList = {
  Tabs: undefined;
  AddMeal: undefined;
  ConfirmMeal: { food: FoodItem; editMeal?: import('../types').MealEntry; initialGrams?: number };
  AddExercise: undefined;
  BarcodeScanner: undefined;
  AddCustomFood: { barcode?: string } | undefined;
  AddRecipe: { editRecipe?: Recipe } | undefined;
  Analytics: undefined;
  Recipes: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  History: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tab_home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('tab_history'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tab_profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="AddMeal" component={AddMealScreen} options={{ title: t('add_meal_title'), presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ConfirmMeal" component={ConfirmMealScreen} options={{ title: t('confirm_title'), presentation: 'modal', animation: 'slide_from_right' }} />
        <Stack.Screen name="AddExercise" component={AddExerciseScreen} options={{ title: t('exercise_title'), presentation: 'modal', animation: 'slide_from_bottom', headerTintColor: colors.error }} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ title: t('scanner_title'), animation: 'fade', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="AddCustomFood" component={AddCustomFoodScreen} options={{ title: t('custom_food_title'), presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AddRecipe" component={AddRecipeScreen} options={{ title: t('recipe_new'), presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: t('tab_analytics'), presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: t('recipe_select'), presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
