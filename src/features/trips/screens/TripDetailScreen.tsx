import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView, StyleSheet, ViewStyle, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/src/features/todos/components/TodoList';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/features/trips/types';
import { AddTodoModal } from '@/src/features/todos/components/AddTodoModal';
import { InviteModal } from '@/src/features/trips/components/InviteModal';
import { useTripStore } from '@/src/features/trips/store';
import { useTodoStore } from '@/src/features/todos/store';
import { useLocationStore } from '@/src/features/location/store/useLocationStore';
import { TripDetailHeader } from '@/src/features/trips/components/TripDetailHeader';
import { QuickActions } from '@/src/features/trips/components/QuickActions';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from '@/src/features/chat/store';
import { TripStats } from '@/src/features/trips/components/TripStats';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';

// Supabase Realtime imports
import { useChatMessages } from '@/src/features/trips/hooks/useChatMessages';
import { useLocations } from '@/src/features/trips/hooks/useLocations';
import { usePresence } from '@/src/features/trips/hooks/usePresence';
import { useReactions } from '@/src/features/trips/hooks/useReactions';
import { useReadReceipts } from '@/src/features/trips/hooks/useReadReceipts';
// Removed SupabaseRealtimeErrorScreen import - no longer needed

interface TripDetailScreenProps {
  trip: Trip;
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { id: tripId } = trip;
  const { theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { isLocationSharingEnabled, startLocationTracking, stopLocationTracking } = useLocationStore();
  const { connectToChat, fetchMessages } = useChatStore();

  // Directly use Supabase Realtime hooks
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    error: messagesError, 
    sendMessage, 
    isConnected: isChatConnected 
  } = useChatMessages({ tripId });

  const { 
    locations, 
    isLoading: isLoadingLocations, 
    error: locationsError, 
    shareLocation, 
    isConnected: isLocationConnected 
  } = useLocations({ tripId });

  const { 
    users, 
    isLoading: isLoadingPresence, 
    error: presenceError, 
    updatePresence, 
    isConnected: isPresenceConnected 
  } = usePresence({ tripId });

  const { 
    reactions, 
    isLoading: isLoadingReactions, 
    error: reactionsError, 
    addReaction, 
    isConnected: isReactionsConnected 
  } = useReactions({ tripId });

  const { 
    readReceipts, 
    isLoading: isLoadingReadReceipts, 
    error: readReceiptsError, 
    updateLastRead, 
    isConnected: isReadReceiptsConnected 
  } = useReadReceipts({ tripId });

  const styles = useThemedStyles((theme) => {
    const backgroundDefault = theme?.colors?.background?.default || '#FFFFFF';
    const spacingStackXl = theme?.spacing?.stack?.xl || 40;
    const breakpointDesktop = theme?.breakpoints?.desktop || 1024;
    
    return {
      container: {
        flex: 1,
        backgroundColor: backgroundDefault,
      } as ViewStyle,
      scrollContainer: {
        flex: 1,
      } as ViewStyle,
      contentContainer: {
        flexGrow: 1,
        alignSelf: 'center',
        width: '100%',
        paddingBottom: spacingStackXl,
      } as ViewStyle,
    };
  });

  const GRID_MARGIN = theme.spacing.layout.screen.padding;
  const GRID_GAP = theme.spacing.layout.section.gap;
  const MAX_WIDTH = Math.min(screenWidth, theme.breakpoints.desktop);
  const CONTENT_WIDTH = MAX_WIDTH - (GRID_MARGIN * 2);
  
  const BASE_CARD_HEIGHT = 180;
  const TALL_CARD_HEIGHT = (BASE_CARD_HEIGHT * 2) + GRID_GAP;
  
  const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

  const containerWidth = Math.min(screenWidth, theme.breakpoints.desktop);

  const carouselItems = [
    {
      id: 'todo-list',
      component: TodoList,
      props: { 
        tripId: tripId,
        onAddTodoPress: () => setShowAddTodo(true)
      }, 
    },
  ];

  const bentoItems = React.useMemo(() => {
    return [
      {
        id: 'carousel',
        element: (
          <BentoCarousel
            items={carouselItems}
            width={CARD_WIDTH}
            height={TALL_CARD_HEIGHT}
          />
        ),
        height: 'tall' as const,
        position: 'left' as const,
      },
      {
        id: 'trip-stats',
        element: (
          <TripStats />
        ),
        height: 'normal' as const,
        position: 'right' as const,
      },
      {
        id: 'quick-actions',
        element: (
          <QuickActions 
            trip={trip}
            setShowInviteModal={setShowInviteModal}
            onLocationPress={() => router.push(`/location/${tripId}`)}
            onChatPress={() => {
              router.push(`/chat/${tripId}`);
            }}
          />
        ),
        height: 'short' as const,
        position: 'right' as const,
      },
    ];
  }, [carouselItems, trip, tripId, CARD_WIDTH, TALL_CARD_HEIGHT, setShowInviteModal]);

  // Initialize chat store for compatibility with existing components
  useEffect(() => {
    if (isChatConnected) {
      logger.info('Trip Detail Screen', `Using Supabase Realtime for trip ${tripId}`);
      // Initialize chat store for compatibility with existing components
      connectToChat(tripId);
      fetchMessages(tripId);
    }
  }, [tripId, isChatConnected, connectToChat, fetchMessages]);

  // Location tracking (independent of realtime system)
  useEffect(() => {
    if (isLocationSharingEnabled) {
      logger.info('TripDetailScreen', `Starting location tracking for trip ${tripId}`);
      startLocationTracking(tripId);
    } else {
      logger.info('TripDetailScreen', `Stopping location tracking for trip ${tripId}`);
      stopLocationTracking();
    }
  }, [isLocationSharingEnabled, tripId, startLocationTracking, stopLocationTracking]);

  // Handle individual hook errors
  const hasErrors = messagesError || locationsError || presenceError || reactionsError || readReceiptsError;
  if (hasErrors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Connection Error
        </Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Unable to connect to real-time features. Please check your connection and try again.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => {
            // Trigger reconnection by navigating away and back
            // or implement retry logic in hooks
          }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <TripDetailHeader 
        trip={trip} 
        onBack={() => router.back()} 
        containerWidth={containerWidth}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: containerWidth }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BentoGrid items={bentoItems} />
      </ScrollView>

      <AddTodoModal
        visible={showAddTodo}
        onClose={() => setShowAddTodo(false)}
        tripId={tripId}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
      />
    </SafeAreaView>
  );
} 