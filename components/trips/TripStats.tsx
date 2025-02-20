// components/trips/TripStats.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

export const TripStats: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Surface style={styles(theme).statsCard} elevation={0}>
      <Text 
        variant="headlineSmall" 
        style={styles(theme).statsTitle}
      >
        Trip Stats
      </Text>
      <View style={styles(theme).statsContent}>
        <Text 
          variant="titleLarge" 
          style={styles(theme).comingSoon}
        >
          Coming soon
        </Text>
      </View>
    </Surface>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  statsCard: {
    padding: theme.spacing.inset.lg,
    height: '100%',
    backgroundColor: theme.colors.surface.variant,
  },
  statsTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.md,
  },
  statsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    color: theme.colors.content.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});