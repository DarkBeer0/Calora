import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { ThemeContext, useThemeProvider } from './src/hooks/useTheme';
import { I18nContext, useI18nProvider } from './src/i18n';
import { useProfile } from './src/hooks/useProfile';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import SplashScreen from './src/components/SplashScreen';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

export default function App() {
  const theme = useThemeProvider();
  const i18n = useI18nProvider();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nContext.Provider value={i18n}>
            <ThemeContext.Provider value={theme}>
              <AppContent />
              <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            </ThemeContext.Provider>
          </I18nContext.Provider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { profile, saveProfile, isLoading } = useProfile();
  const [splashDone, setSplashDone] = useState(false);

  if (isLoading || !splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  if (!profile.isOnboarded) {
    return (
      <OnboardingScreen
        onDone={() => saveProfile({ ...profile, isOnboarded: true })}
      />
    );
  }

  return <RootNavigator />;
}
