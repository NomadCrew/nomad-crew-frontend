import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText 
        category="display" 
        variant="large" 
        style={styles.title}
      >
        Welcome to NomadCrew!
      </ThemedText>
      <ThemedText 
        category="body" 
        variant="large" 
        style={styles.subtitle}
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
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
});