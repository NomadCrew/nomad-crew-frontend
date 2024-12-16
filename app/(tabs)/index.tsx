import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText 
        style={[styles.title, { color: theme.colors.content.primary }]}
      >
        Welcome to NomadCrew!
      </ThemedText>
      <ThemedText 
        style={[styles.subtitle, { color: theme.colors.content.secondary }]}
      >
        Your group travel companion
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
});