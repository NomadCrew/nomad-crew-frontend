// screens/trips/TripDetailScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/components/todo/TodoList';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/types/trip';
import { AddTodoModal } from '@/components/todo/AddTodoModal';
import { InviteModal } from '@/components/trips/InviteModal';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import { useTripStore } from '@/src/store/useTripStore';
import { useTodoStore } from '@/src/store/useTodoStore';
import { useLocationStore } from '@/src/store/useLocationStore';
import { TripDetailHeader } from '@/components/trips/TripDetailHeader';
import { QuickActions } from '@/components/trips/QuickActions';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from '@/src/store/useChatStore';
import { TripStats } from '@/components/trips/TripStats';
import { useThemedStyles } from '@/src/theme/utils';
import { isChatEvent } from '@/src/types/events';
import { ChatCard } from '@/components/chat/ChatCard';
import { logger } from '@/src/utils/logger';

interface TripDetailScreenProps {
  trip: Trip;
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { id: tripId } = trip;
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { isLocationSharingEnabled, startLocationTracking, stopLocationTracking } = useLocationStore();
  const { connectToChat, disconnectFromChat, fetchMessages } = useChatStore();

  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
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

  // Calculate responsive dimensions
  const GRID_MARGIN = theme.spacing.layout.screen.padding;
  const GRID_GAP = theme.spacing.layout.section.gap;
  const MAX_WIDTH = Math.min(screenWidth, theme.breakpoints.desktop);
  const CONTENT_WIDTH = MAX_WIDTH - (GRID_MARGIN * 2);
  
  // Base and tall card heights
  const BASE_CARD_HEIGHT = 180;
  const TALL_CARD_HEIGHT = (BASE_CARD_HEIGHT * 2) + GRID_GAP;
  
  // Calculate card width based on available space
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
  }, [carouselItems, trip, tripId, CARD_WIDTH, TALL_CARD_HEIGHT, BASE_CARD_HEIGHT, setShowInviteModal]);

  useEffect(() => {
    // Set up WebSocket connection for the entire trip experience
    logger.info('Trip Detail Screen', `Setting up WebSocket connection for trip ${tripId}`);
    const manager = WebSocketManager.getInstance();
    
    // Check if already connected
    const isConnectedBefore = manager.isConnected();
    logger.info('Trip Detail Screen', `WebSocket connection status before connect: ${isConnectedBefore ? 'connected' : 'disconnected'}`);
    
    // Connect to WebSocket and set up event handlers for all trip-related features
    manager.connect(tripId, {
      onMessage: (event) => {
        // Handle all types of events at the trip level
        useTripStore.getState().handleTripEvent(event);
        useTodoStore.getState().handleTodoEvent(event);
        
        // Handle chat events
        if (isChatEvent(event)) {
          useChatStore.getState().handleChatEvent(event);
        }
      }
    }).then(() => {
      const isConnectedAfter = manager.isConnected();
      logger.info('UI', `WebSocket connection status after connect: ${isConnectedAfter ? 'connected' : 'disconnected'}`);
    }).catch(error => {
      logger.error('UI', `Failed to connect to WebSocket for trip ${tripId}:`, error);
    });
    
    // Initialize chat data for this trip
    connectToChat(tripId);
    
    // Fetch messages for this trip
    fetchMessages(tripId);
    
    // Start location tracking if location sharing is enabled
    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    }

    return () => {
      logger.info('Trip Detail Screen', `Cleaning up WebSocket connection for trip ${tripId}`);
      manager.disconnect();
      stopLocationTracking();
    };
  }, [tripId, isLocationSharingEnabled, connectToChat, fetchMessages]);

  // Effect to handle changes in location sharing preference
  useEffect(() => {
    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    } else {
      stopLocationTracking();
    }
  }, [isLocationSharingEnabled, tripId]);

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