import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Surface, Text, IconButton } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripHeader } from '@/components/trips/TripHeader';
import type { Theme } from '@/src/theme/types';
import { BentoGrid } from '@/components/ui/BentoGrid';
import type { Trip } from '@/src/types/trip';

const TripInfoCard = ({ trip }: { trip: Trip }) => {
  const { theme } = useTheme();
    
  return (
    <Surface style={styles(theme).infoCard} elevation={0}>
      {/* Location Section */}
      <View>
        <View style={styles(theme).destinationContainer}>
          <Text 
            variant="displaySmall" 
            style={styles(theme).destination}
          >
            {trip.destination.split(',')[0]}
          </Text>
        </View>
      </View>
      
      {/* Date Section */}
      <View style={styles(theme).dateContainer}>
        <Text 
          variant="titleLarge" 
          style={styles(theme).date}
        >
          {format(new Date(trip.startDate), 'MMM dd')} -{'\n'}
          {format(new Date(trip.endDate), 'MMM dd, yyyy')}
        </Text>
      </View>
      
    </Surface>
  );
};

const QuickActions = () => {
  const { theme } = useTheme();
  
  const actions = [
    { icon: 'map-marker', label: 'Location' },
    { icon: 'message-outline', label: 'Chat' },
    { icon: 'account-group', label: 'Members' },
  ];
  
  return (
    <Surface style={styles(theme).actionsCard} elevation={0}>
      <Text 
        variant="headlineSmall" 
        style={styles(theme).actionTitle}
      >
        Quick{'\n'}Actions
      </Text>
      <View style={styles(theme).actionButtons}>
        {actions.map((action) => (
          <View key={action.label} style={styles(theme).actionButtons}>
            <Surface 
              style={styles(theme).iconContainer} 
              elevation={0}
            >
              <IconButton
                icon={action.icon}
                size={32}
                iconColor={theme.colors.content.primary}
                style={styles(theme).icon}
              />
            </Surface>
            <Text 
              variant="bodyMedium" 
              style={styles(theme).actionLabel}
            >
              {action.label}
            </Text>
          </View>
        ))}
      </View>
    </Surface>
  );
};

// TripStats component
const TripStats = () => {
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

export default function TripDetailScreen({ trip }: { trip: Trip }) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive values
  console.log(theme);
  const isTablet = screenWidth >= theme.breakpoints.tablet;
  const containerWidth = Math.min(screenWidth, theme.breakpoints.desktop);

  const bentoItems = React.useMemo(() => [
    {
      id: '1',
      element: <TripInfoCard trip={trip} />,
      height: 'tall' as const,
      position: 'left' as const,
    },
    {
      id: '2',
      element: <QuickActions />,
      height: 'normal' as const,
      position: 'right' as const,
    },
    {
      id: '3',
      element: <TripStats />,
      height: 'normal' as const,
      position: 'right' as const,
    },
  ], [trip]);

  return (
    <View style={styles(theme).container}>
      <SafeAreaView style={styles(theme).headerContainer}>
        <View style={[styles(theme).headerContent, { maxWidth: containerWidth }]}>
          <TripHeader trip={trip} onBack={() => router.back()} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles(theme).scrollContainer}
        contentContainerStyle={[
          styles(theme).contentContainer,
          { maxWidth: containerWidth }
        ]}
      >
        <BentoGrid items={bentoItems} />
      </ScrollView>
    </View>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
  },
  infoCard: {
    padding: theme.spacing.inset.xl,
    height: '100%',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.variant,
  },
  label: {
    color: theme.colors.content.secondary,
    opacity: 0.7,
    marginBottom: 8,
  },
  destinationContainer: {
    marginTop: theme.spacing.stack.md,
  },
  destination: {
    ...theme.typography.display.small,
    color: theme.colors.content.primary,
    lineHeight: 48,
  },
  dateContainer: {
    marginVertical: theme.spacing.stack.xl,
  },
  date: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.secondary,
    lineHeight: 32,
  },
  description: {
    color: theme.colors.content.secondary,
    opacity: 0.8,
  },
  actionsCard: {
    padding: theme.spacing.inset.lg,
    height: '100%',
    backgroundColor: theme.colors.surface.variant,
  },
  actionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: theme.spacing.stack.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    margin: 0,
  },
  actionLabel: {
    color: theme.colors.content.secondary,
    textAlign: 'center',
  },
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