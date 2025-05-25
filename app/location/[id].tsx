import { useLocalSearchParams } from 'expo-router';
import { useTripStore } from '@/src/features/trips/store';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { GroupLiveMap } from '@/components/location/GroupLiveMap';
import { useRouter } from 'expo-router';
import LoadingScreen from '@/src/components/common/LoadingScreen';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { logger } from '@/src/utils/logger';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { Trip } from '@/src/features/trips/types';
import { Theme } from '@/src/theme/types';
import LocationDetailScreen from '@/src/features/location/screens/LocationScreen';

export default function LocationRoute() {
  const { id } = useLocalSearchParams();
  // Add your location screen component logic here
  
  return <LocationDetailScreen locationId={id as string} />;
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.default,
  },
  errorText: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.content.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary.main,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.primary.text,
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
  },
}); 