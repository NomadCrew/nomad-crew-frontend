// components/trips/TripStats.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { CalendarClock } from 'lucide-react-native';

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
        <View style={styles(theme).comingSoonContainer}>
          <CalendarClock size={32} color={theme.colors.content.secondary} style={styles(theme).icon} />
          <Text 
            variant="titleLarge" 
            style={styles(theme).comingSoon}
          >
            Coming soon
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  statsCard: {
    height: '100%',
    width: '100%',
    padding: theme.spacing.inset.lg,
    backgroundColor: theme.colors.surface.variant,
    borderRadius: 24,
    flex: 1,
  },
  statsTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.md,
    fontWeight: '600',
  },
  statsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: theme.spacing.stack.sm,
    opacity: 0.6,
  },
  comingSoon: {
    color: theme.colors.content.secondary,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.25,
  },
});