// screens/trips/TripDetailScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView } from 'react-native';
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
import { LocationModal } from '@/components/trips/LocationModal';
import { isChatEvent } from '@/src/types/events';

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
  const [showLocationModal, setShowLocationModal] = useState(false);

  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const backgroundDefault = theme?.colors?.background?.default || '#FFFFFF';
    const spacingStackXl = theme?.spacing?.stack?.xl || 40;
    const breakpointDesktop = theme?.breakpoints?.desktop || 1024;
    
    return {
      container: {
        flex: 1,
        backgroundColor: backgroundDefault,
      },
      scrollContainer: {
        flex: 1,
      },
      contentContainer: {
        flexGrow: 1,
        alignSelf: 'center',
        width: '100%',
        paddingBottom: spacingStackXl,
      },
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
            onChatPress={() => {
              console.log('Navigating to chat with tripId:', tripId);
              router.push(`/chat/${tripId}`);
            }}
            onLocationPress={() => setShowLocationModal(true)}
          />
        ),
        height: 'short' as const,
        position: 'right' as const,
      },
    ];
  }, [carouselItems, trip, tripId, CARD_WIDTH, TALL_CARD_HEIGHT, BASE_CARD_HEIGHT, setShowInviteModal, setShowLocationModal]);

  useEffect(() => {
    const manager = WebSocketManager.getInstance();
    manager.connect(tripId, {
      onMessage: (event) => {
        useTripStore.getState().handleTripEvent(event);
        useTodoStore.getState().handleTodoEvent(event);
        // Add chat event handling
        if (isChatEvent(event)) {
          useChatStore.getState().handleChatEvent(event);
        }
      }
    });
    
    // Fetch chat groups for this trip
    useChatStore.getState().fetchChatGroups(tripId);
    
    // Start location tracking if location sharing is enabled
    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    }

    return () => {
      manager.disconnect();
      stopLocationTracking();
    };
  }, [tripId, isLocationSharingEnabled]);

  // Effect to handle changes in location sharing preference
  useEffect(() => {
    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    } else {
      stopLocationTracking();
    }
  }, [isLocationSharingEnabled, tripId]);

  // Effect to handle chat events
  useEffect(() => {
    // Fetch chat groups when the component mounts
    useChatStore.getState().fetchChatGroups(tripId);
  }, [tripId]);

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

      {/* Location sharing modal */}
      {showLocationModal && (
        <LocationModal
          tripId={tripId}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </SafeAreaView>
  );
}