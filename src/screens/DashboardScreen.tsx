import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calora</Text>
      <Text style={styles.subtitle}>Дашборд — скоро здесь будут кольца прогресса</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
