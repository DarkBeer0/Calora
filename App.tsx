import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeContext, useThemeProvider } from './src/hooks/useTheme';
import { I18nContext, useI18nProvider } from './src/i18n';
import { useProfile } from './src/hooks/useProfile';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';

export default function App() {
  const theme = useThemeProvider();
  const i18n = useI18nProvider();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nContext.Provider value={i18n}>
        <ThemeContext.Provider value={theme}>
          <AppContent />
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        </ThemeContext.Provider>
      </I18nContext.Provider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { profile, saveProfile, isLoading } = useProfile();

  if (isLoading) return null;

  if (!profile.isOnboarded) {
    return (
      <OnboardingScreen
        onDone={() => saveProfile({ ...profile, isOnboarded: true })}
      />
    );
  }

  return <RootNavigator />;
}
