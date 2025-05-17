import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/components/todo/TodoList';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/features/trips/types';
import { AddTodoModal } from '@/components/todo/AddTodoModal';
import { InviteModal } from '@/src/features/trips/components/InviteModal';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import { useTripStore } from '@/src/features/trips/store';
import { useTodoStore } from '@/src/store/useTodoStore';
import { useLocationStore } from '@/src/store/useLocationStore';
import { TripDetailHeader } from '@/src/features/trips/components/TripDetailHeader';
import { QuickActions } from '@/src/features/trips/components/QuickActions';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from '@/src/features/chat/store';
import { TripStats } from '@/src/features/trips/components/TripStats';
import { useThemedStyles } from '@/src/theme/utils';
import { isChatEvent } from '@/src/types/events';
import { ChatCard } from '@/src/features/chat/components/ChatCard';
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
  }, [carouselItems, trip, tripId, CARD_WIDTH, TALL_CARD_HEIGHT, BASE_CARD_HEIGHT, setShowInviteModal]);

  useEffect(() => {
    logger.info('Trip Detail Screen', `Setting up WebSocket connection for trip ${tripId}`);
    const manager = WebSocketManager.getInstance();
    
    const isConnectedBefore = manager.isConnected();
    logger.info('Trip Detail Screen', `WebSocket connection status before connect: ${isConnectedBefore ? 'connected' : 'disconnected'}`);
    
    manager.connect(tripId, {
      onMessage: (event) => {
        useTripStore.getState().handleTripEvent(event);
        useTodoStore.getState().handleTodoEvent(event);
        
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
    
    connectToChat(tripId);
    
    fetchMessages(tripId);
    
    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    }

    return () => {
      logger.info('Trip Detail Screen', `Cleaning up WebSocket connection for trip ${tripId}`);
      manager.disconnect();
      stopLocationTracking();
    };
  }, [tripId, isLocationSharingEnabled, connectToChat, fetchMessages]);

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