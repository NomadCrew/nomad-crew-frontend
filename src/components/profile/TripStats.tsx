import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { useThemedStyles } from '@/src/theme/utils';

export interface TripStatsProps {
  trips: number;
  countries: number;
  daysTraveled: number;
}

interface StatItemProps {
  value: number;
  label: string;
  primaryColor: string;
}

function StatItem({ value, label, primaryColor }: StatItemProps) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <ThemedText
        variant="display.small"
        style={{ color: primaryColor, fontWeight: '700' }}
      >
        {value}
      </ThemedText>
      <ThemedText variant="body.small" color="content.secondary">
        {label}
      </ThemedText>
    </View>
  );
}

/**
 * A trip statistics display component showing trips, countries, and days traveled.
 * Displays as a horizontal row with three evenly-spaced stat items.
 */
export function TripStats({ trips, countries, daysTraveled }: TripStatsProps) {
  const styles = useThemedStyles((theme) => ({
    container: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
      paddingVertical: theme.spacing?.inset?.md ?? 16,
      paddingHorizontal: theme.spacing?.inset?.md ?? 16,
      marginHorizontal: theme.spacing?.inset?.md ?? 16,
      backgroundColor: theme.colors?.background?.card ?? '#FFFFFF',
      borderRadius: theme.borderRadius?.md ?? 8,
    },
    primaryColor: theme.colors?.primary?.main ?? '#F46315',
  }));

  return (
    <View style={styles.container}>
      <StatItem value={trips} label="Trips" primaryColor={styles.primaryColor} />
      <StatItem value={countries} label="Countries" primaryColor={styles.primaryColor} />
      <StatItem value={daysTraveled} label="Days" primaryColor={styles.primaryColor} />
    </View>
  );
}

export default React.memo(TripStats);
