import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
  Pressable,
  View,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedView } from '@/components/ThemedView';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { TripList } from '@/components/trips/TripList';
import { Trip } from '@/src/types/trip';
import { Theme } from '@/src/theme/types';
import { useTripStore } from '@/src/store/useTripStore';
import { TripStatus } from '@/src/types/trip';
import CreateTripModal from '@/components/trips/CreateTripModal';
import { useAuthStore } from '@/src/features/auth';
import { RefreshControl } from 'react-native';
import Avatar from '@/components/ui/Avatar';


export default function TripsScreen() {
  const [activeTab, setActiveTab] = useState<'Active' | 'History' | 'Cancelled'>('Active');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const { token, isInitialized } = useAuthStore();

  const router = useRouter();

  const searchWidth = useRef(new Animated.Value(40)).current;

  // State for Create Trip Modal
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  // Import trips and fetchTrips from the store
  const { trips, fetchTrips, createTrip, loading: tripsLoading } = useTripStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch trips when component mounts
  useEffect(() => {
    if (isInitialized && token) {
      fetchTrips();
    }
  }, [fetchTrips, token, isInitialized]);
  

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

  // Filter trips based on active tab and search query
  const filteredTrips = React.useMemo(() => {
    let filtered = [...trips];
    filtered = filtered.map(trip => {
      let normalizedStatus = trip.status?.toUpperCase();
      if (normalizedStatus === 'PLANNED') {
        normalizedStatus = 'PLANNING';
      }
      return {
        ...trip,
        status: normalizedStatus as TripStatus
      };
    });
  
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((trip) =>
        trip.name.toLowerCase().includes(query) ||
        trip.destination?.address?.toLowerCase().includes(query)
      );
    }
  
    // Normalize status for comparison
    filtered = filtered.map(trip => ({
      ...trip,
      status: trip.status?.toUpperCase() as TripStatus
    }));
  
    const now = new Date();
    
    // Filter by tab
    switch (activeTab) {
      case 'Active':
        return filtered.filter((trip) => {
          const endDate = new Date(trip.endDate);
          return (trip.status === 'ACTIVE' || trip.status === 'PLANNING') && 
                 endDate >= now; // Only show trips that haven't ended yet
        });
      case 'History':
        return filtered.filter((trip) => {
          const endDate = new Date(trip.endDate);
          return trip.status === 'COMPLETED' || 
                 endDate < now; // Show completed trips or trips that have ended
        });
      case 'Cancelled':
        return filtered.filter((trip) => trip.status === 'CANCELLED');
      default:
        return filtered;
    }
  }, [trips, activeTab, searchQuery]);

  const handleTripPress = (trip: Trip) => {
    router.push({
      pathname: '/trip/[id]',
      params: { id: trip.id }
    });
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchTrips();
    } catch (error) {
      // Failed to refresh trips
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTrips]);

  const handleCreateTrip = () => {
    setCreateModalVisible(true);
  };

  const handleModalClose = () => {
    setCreateModalVisible(false);
  };

  const handleTripSubmit = async (tripData: Trip) => {
    try {
      await createTrip({
        name: tripData.name,
        description: tripData.description,
        destination: {
          address: tripData.destination.address,
          placeId: tripData.destination.placeId || "",
          coordinates: tripData.destination.coordinates,
        },
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
      });
      setCreateModalVisible(false);
    } catch (error) {
      // Failed to create trip
      // Optionally, show an error message to the user
    }
  };

  return (
    
    <SafeAreaView style={styles(theme, screenWidth).container}>
      <ThemedView style={styles(theme).header}>
        <ThemedText style={styles(theme).headerText}>
          Trips
        </ThemedText>
        <ThemedView style={styles(theme).headerActions}>
          <Animated.View style={{ width: searchWidth }}>
            {searchExpanded ? (
              <TextInput
                style={styles(theme).searchInput}
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
              <TouchableOpacity onPress={toggleSearch} style={styles(theme).iconButton}>
                <Ionicons
                  name="search"
                  size={24}
                  color={theme.colors.content.primary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </ThemedView>
      </ThemedView>

      {/* Tabs Section */}
      <ThemedView style={styles(theme).tabs}>
        {['Active', 'History', 'Cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as 'Active' | 'History' | 'Cancelled')}
            style={[
              styles(theme).tabButton,
              activeTab === tab && styles(theme).activeTabButton,
            ]}
          >
            <Text
              style={[
                styles(theme).tabText,
                activeTab === tab && styles(theme).activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* Trip List */}
      <ScrollView
        style={[
          styles(theme).listContainer,
          { flex: 1 }
        ]}
        contentContainerStyle={[
          styles(theme).listContentContainer,
          // Only add flexGrow if list is empty
          trips.length === 0 ? { flexGrow: 1 } : undefined
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
            progressBackgroundColor={theme.colors.surface.default}
            // Add these props to help with gesture detection
            enabled={true}
            progressViewOffset={0}
          />
        }
        scrollEventThrottle={16}
        alwaysBounceVertical={true} // iOS specific
        bounces={true} // iOS specific
      >
        {tripsLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        ) : filteredTrips && filteredTrips.length > 0 ? (
          <TripList
            trips={filteredTrips}
            onTripPress={handleTripPress}
          />
        ) : (
          <ThemedView style={styles(theme).emptyContainer}>
            <ThemedText style={styles(theme).emptyText}>
              No trips found for this filter
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Create Trip Modal */}
      <CreateTripModal
        visible={isCreateModalVisible}
        onClose={handleModalClose}
        onSubmit={handleTripSubmit}
      />

      {/* Add Trip FAB */}
      <Pressable 
        onPress={handleCreateTrip}
        style={({ pressed }) => [
          styles(theme).createTripFab,
          { opacity: pressed ? 0.8 : 1 }
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = (theme: Theme, screenWidth?: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.variant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.layout.screen.padding,
      marginBottom: theme.spacing.layout.section.gap,
      backgroundColor: theme.colors.surface.variant,
      paddingTop: theme.spacing.layout.section.padding,
    },
    headerText: {
      ...theme.typography.heading.h1,
      color: '#FFFFFF',
      marginBottom: theme.spacing.inset.sm,
      marginTop: theme.spacing.stack.md,
      flexShrink: 0,
      flexGrow: 0,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: theme.spacing.inset.sm,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: theme.spacing.inset.sm,
      paddingVertical: 4,
      height: 36,
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginBottom: theme.spacing.layout.section.padding,
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
      padding: theme.spacing.layout.section.padding,
    },
    emptyText: {
      ...theme.typography.body.large,
      color: theme.colors.content.secondary,
      textAlign: 'center',
    },
    createTripFab: {
      position: 'absolute',
      bottom: 80, // Position above the tab bar
      right: theme.spacing.inset.md,
      backgroundColor: theme.colors.primary.main,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
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
      zIndex: 10,
    },
  });