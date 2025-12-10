import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Text,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripList } from '@/src/features/trips/components/TripList';
import { useTrips, useCreateTrip } from '@/src/features/trips/hooks';
import { router } from 'expo-router';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { Trip, CreateTripInput } from '@/src/features/trips/types';
import { FAB, ActivityIndicator } from 'react-native-paper';
import CreateTripModal from '@/src/features/trips/components/CreateTripModal';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { logger } from '@/src/utils/logger';

const TABS: { key: 'Active' | 'History' | 'Cancelled'; label: string }[] = [
  { key: 'Active', label: 'Active' },
  { key: 'History', label: 'History' },
  { key: 'Cancelled', label: 'Cancelled' },
];

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.layout.screen.padding,
      marginBottom: 0,
      backgroundColor: theme.colors.surface.variant,
      paddingTop: theme.spacing.layout.section.padding,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: theme.spacing.inset.sm,
      paddingVertical: 4,
      height: 36,
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },
    iconButton: {
      padding: theme.spacing.inset.sm,
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: theme.colors.surface.variant,
    },
    tabButton: { paddingVertical: theme.spacing.inline.sm },
    activeTabButton: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary.main,
    },
    tabText: {
      ...theme.typography.button.medium,
      color: theme.colors.content.secondary,
    },
    activeTabText: {
      color: theme.colors.primary.main,
      fontWeight: theme.typography.button.medium.fontWeight,
    },
    listContainer: {
      flex: 1,
      paddingTop: 0,
    },
    listContentContainer: {
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      ...theme.typography.body.large,
      color: theme.colors.content.secondary,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 24,
      zIndex: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        },
        android: {
          elevation: 5,
        },
      }),
    },
  });
}

/**
 * Renders the main "Trips" screen: a searchable, tabbed list of trips with pull-to-refresh,
 * a modal to create new trips, and a floating action button to open the modal.
 *
 * The screen displays tabs for Active, History, and Cancelled trips, supports client-side
 * filtering by name or destination, and navigates to a trip's details when a trip is pressed.
 *
 * @returns The React element tree for the Trips screen.
 */
export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { data: trips = [], isLoading: tripsLoading, refetch } = useTrips();
  const createTripMutation = useCreateTrip();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useAppTheme();
  const styles = getStyles(theme);
  const [activeTab, setActiveTab] = useState<'Active' | 'History' | 'Cancelled'>('Active');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const screenWidth = Dimensions.get('window').width;
  const searchWidth = useRef(new Animated.Value(40)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleSearch = () => {
    Animated.timing(searchWidth, {
      toValue: searchExpanded ? 40 : screenWidth * 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSearchExpanded(!searchExpanded);
      if (!searchExpanded) {
        setSearchQuery('');
      }
    });
  };

  const filteredTrips = React.useMemo(() => {
    if (__DEV__) {
      logger.info(
        'UI',
        'TripsScreen: Recalculating filteredTrips. Trips from TanStack Query:',
        trips
      );
    }
    let filtered = [...trips];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.name.toLowerCase().includes(query) ||
          (trip.destination?.address && trip.destination.address.toLowerCase().includes(query))
      );
    }
    const now = new Date();
    switch (activeTab) {
      case 'Active':
        return filtered.filter((trip) => {
          const endDate = new Date(trip.endDate);
          return (trip.status === 'ACTIVE' || trip.status === 'PLANNING') && endDate >= now;
        });
      case 'History':
        return filtered.filter((trip) => {
          const endDate = new Date(trip.endDate);
          return trip.status === 'COMPLETED' || endDate < now;
        });
      case 'Cancelled':
        return filtered.filter((trip) => trip.status === 'CANCELLED');
      default:
        return filtered;
    }
  }, [trips, activeTab, searchQuery]);

  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (_error) {
      // Optionally handle error
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleSubmit = async (tripData: Trip) => {
    const input: CreateTripInput = {
      name: tripData.name || '',
      description: tripData.description,
      destination: {
        address: tripData.destination?.address || '',
        placeId: tripData.destination?.placeId || '',
        coordinates: tripData.destination?.coordinates,
      },
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
    };
    logger.info('UI', 'TripsScreen handleSubmit input:', input);

    try {
      const createdTrip = await createTripMutation.mutateAsync(input);
      logger.info('UI', 'TripsScreen handleSubmit createdTrip:', createdTrip);
      setModalVisible(false);
      return createdTrip;
    } catch (error) {
      logger.error('UI', 'Failed to create trip:', error);
      throw error;
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with search */}
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">My Trips</ThemedText>
        <Animated.View style={{ width: searchWidth }}>
          {searchExpanded ? (
            <TextInput
              style={styles.searchInput}
              placeholder="Search trips..."
              placeholderTextColor={theme.colors.content.secondary}
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              onBlur={() => {
                if (!searchQuery) {
                  toggleSearch();
                }
              }}
            />
          ) : (
            <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
              <Ionicons name="search" size={24} color={theme.colors.content.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </ThemedView>

      {/* Tabs Section */}
      <ThemedView style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* Trip List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
            progressBackgroundColor={theme.colors.surface.default}
            enabled={true}
            progressViewOffset={0}
          />
        }
        scrollEventThrottle={16}
        alwaysBounceVertical={true}
        bounces={true}
      >
        {tripsLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        ) : filteredTrips && filteredTrips.length > 0 ? (
          <TripList trips={filteredTrips} onTripPress={handleTripPress} />
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No trips found for this filter</ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Create Trip Modal */}
      <CreateTripModal visible={modalVisible} onClose={handleCloseModal} onSubmit={handleSubmit} />

      {/* Add Trip FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { bottom: insets.bottom + 24, backgroundColor: theme.colors.primary.main },
        ]}
        color={theme.colors.primary.onPrimary}
        onPress={handleOpenModal}
        accessibilityLabel="Create a new trip"
      />
    </ThemedView>
  );
}
