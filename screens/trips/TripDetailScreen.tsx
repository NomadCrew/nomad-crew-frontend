import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
      <View>
        <Text 
          variant="bodyMedium" 
          style={styles(theme).label}
        >
          Location
        </Text>
        <View style={styles(theme).destinationContainer}>
          <Text 
            variant="displaySmall" 
            style={styles(theme).destination}
          >
            New{'\n'}York
          </Text>
        </View>
      </View>
      
      <View style={styles(theme).dateContainer}>
        <Text 
          variant="titleLarge" 
          style={styles(theme).date}
        >
          Jan 19 -{'\n'}Jan 29, 2025
        </Text>
      </View>
      
      <Text 
        variant="bodyLarge" 
        style={styles(theme).description}
      >
        {trip.description}
      </Text>
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
          <View key={action.label} style={styles(theme).actionButton}>
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
    padding: 28,
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
    marginTop: 4,
  },
  destination: {
    color: theme.colors.content.primary,
    fontWeight: '700',
    lineHeight: 52,
  },
  dateContainer: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  date: {
    color: theme.colors.content.secondary,
    lineHeight: 32,
  },
  description: {
    color: theme.colors.content.secondary,
    opacity: 0.8,
  },
  actionsCard: {
    padding: 24,
    height: '100%',
    backgroundColor: theme.colors.surface.variant,
  },
  actionTitle: {
    color: theme.colors.content.primary,
    marginBottom: 24,
    lineHeight: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
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
    padding: 24,
    height: '100%',
    backgroundColor: theme.colors.surface.variant,
  },
  statsTitle: {
    color: theme.colors.content.primary,
    marginBottom: 16,
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