import { StatusBar } from 'expo-status-bar';
import { ThemeContext, useThemeProvider } from './src/hooks/useTheme';
import { I18nContext, useI18nProvider } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const theme = useThemeProvider();
  const i18n = useI18nProvider();

  return (
    <I18nContext.Provider value={i18n}>
      <ThemeContext.Provider value={theme}>
        <RootNavigator />
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </ThemeContext.Provider>
    </I18nContext.Provider>
  );
}
