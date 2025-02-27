// components/trips/TripDetailHeader.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripHeader } from './TripHeader';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/types/trip';

interface TripDetailHeaderProps {
  trip: Trip;
  onBack: () => void;
  containerWidth: number;
}

export const TripDetailHeader: React.FC<TripDetailHeaderProps> = ({
  trip,
  onBack,
  containerWidth
}) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={styles(theme).headerContainer}>
      <View style={[styles(theme).headerContent, { maxWidth: containerWidth }]}>
        <TripHeader trip={trip} onBack={onBack} />
      </View>
    </SafeAreaView>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  headerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
  },
});