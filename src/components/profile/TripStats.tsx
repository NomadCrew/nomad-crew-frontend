import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { useThemedStyles } from '@/src/theme/utils';

export interface TripStatsProps {
  trips: number;
  destinations: number;
  daysTraveled?: number;
}

/** Format large numbers for compact display (e.g. 12345 → "12K") */
function formatStatValue(value: number): string {
  if (value >= 10_000) return `${Math.floor(value / 1000)}K`;
  if (value >= 1_000) return value.toLocaleString();
  return String(value);
}

interface StatItemProps {
  value: number;
  label: string;
  primaryColor: string;
}

function StatItem({ value, label, primaryColor }: StatItemProps) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <ThemedText variant="display.small" style={{ color: primaryColor, fontWeight: '700' }}>
        {formatStatValue(value)}
      </ThemedText>
      <ThemedText variant="body.small" color="content.secondary">
        {label}
      </ThemedText>
    </View>
  );
}

/**
 * Trip statistics display for the profile screen.
 * Shows completed trips, unique destinations, and optionally days traveled.
 */
export function TripStats({ trips, destinations, daysTraveled }: TripStatsProps) {
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
      <StatItem value={destinations} label="Destinations" primaryColor={styles.primaryColor} />
      {daysTraveled !== undefined && (
        <StatItem value={daysTraveled} label="Days" primaryColor={styles.primaryColor} />
      )}
    </View>
  );
}

export default React.memo(TripStats);
