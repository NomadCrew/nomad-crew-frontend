// components/trips/TripHeader.tsx 
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/components/ThemedText';
import { TripStatusBadge } from './TripStatusBadge';
import { format } from 'date-fns';
import type { Trip } from '@/src/types/trip';

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onBookmark?: () => void;
}

export const TripHeader = ({ trip, onBack, onBookmark }: TripHeaderProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).topRow}>
        <Pressable onPress={onBack} style={styles(theme).backButton}>
          <ArrowLeft size={24} color={theme.colors.content.primary} />
        </Pressable>
        
        {onBookmark && (
          <Pressable onPress={onBookmark} style={styles(theme).iconButton}>
            <Bookmark size={24} color={theme.colors.content.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles(theme).contentContainer}>
        <ThemedText variant="heading.h2" style={styles(theme).title}>
          {trip.name}
        </ThemedText>
        
        <View style={styles(theme).detailsRow}>
          <ThemedText variant="body.medium" color="content.secondary">
            {trip.destination}
          </ThemedText>
          <TripStatusBadge status={trip.status} size="small" />
        </View>

        <ThemedText 
          variant="body.small" 
          color="content.tertiary"
          style={styles(theme).dates}
        >
          {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.inset.md,
    paddingTop: theme.spacing.inset.xl,
    paddingBottom: theme.spacing.inset.md,
    backgroundColor: theme.colors.surface.default,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.stack.sm,
  },
  backButton: {
    padding: theme.spacing.inset.xs,
    marginLeft: -theme.spacing.inset.xs,
  },
  iconButton: {
    padding: theme.spacing.inset.xs,
  },
  contentContainer: {
    gap: theme.spacing.stack.xs,
  },
  title: {
    marginBottom: theme.spacing.stack.xxs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dates: {
    marginTop: theme.spacing.stack.xxs,
  }
});