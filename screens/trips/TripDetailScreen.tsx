import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripHeader } from '@/components/trips/TripHeader';
import type { Trip } from '@/src/types/trip';

interface TripDetailScreenProps {
  trip: Trip; // We'll get this from route params later
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={styles(theme).container}>
      <TripHeader 
        trip={trip}
        onBack={() => router.back()}
        onBookmark={() => console.log('Bookmark pressed')}
      />
      
      {/* Bento grid container */}
      <View style={styles(theme).gridContainer}>
        {/* Grid implementation coming next */}
      </View>

      {/* Bottom action buttons */}
      <View style={styles(theme).actionButtons}>
        {/* Action buttons coming next */}
      </View>
    </SafeAreaView>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  gridContainer: {
    flex: 1,
    padding: theme.spacing.inset.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.inset.md,
    paddingBottom: theme.spacing.inset.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
});