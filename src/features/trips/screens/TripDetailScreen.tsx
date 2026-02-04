import React, { useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView, Text, ViewStyle } from 'react-native';
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
import { useLocationStore } from '@/src/features/location/store/useLocationStore';
import { TripDetailHeader } from '@/src/features/trips/components/TripDetailHeader';
import { QuickActions } from '@/src/features/trips/components/QuickActions';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from '@/src/features/chat/store';
import { TripStats } from '@/src/features/trips/components/TripStats';
import { useThemedStyles } from '@/src/theme/utils';
import { WebSocketManager } from '@/src/features/websocket/WebSocketManager';
import { BaseEventSchema, isChatEvent, isServerEvent } from '@/src/types/events';
import { ZodNotificationSchema } from '@/src/features/notifications/types/notification';
import { useNotificationStore } from '@/src/features/notifications/store/useNotificationStore';
import { logger } from '@/src/utils/logger';
import { useTripPermissions } from '@/src/features/auth/permissions';

interface TripDetailScreenProps {
  trip: Trip;
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { id: tripId } = trip;
  const { theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { isLocationSharingEnabled, startLocationTracking, stopLocationTracking } =
    useLocationStore();
  const { connectToChat, fetchMessages } = useChatStore();

  // Set up permission context for this trip (unused vars prefixed with _)
  const {
    can: _can,
    isAdminOrOwner: _isAdminOrOwner,
    isOwner: _isOwner,
  } = useTripPermissions({ trip });

  const styles = useThemedStyles((theme) => {
    const backgroundDefault = theme?.colors?.background?.default || '#FFFFFF';
    const spacingStackXl = theme?.spacing?.stack?.xl || 40;

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
  const CONTENT_WIDTH = MAX_WIDTH - GRID_MARGIN * 2;

  const BASE_CARD_HEIGHT = 180;
  const TALL_CARD_HEIGHT = BASE_CARD_HEIGHT * 2 + GRID_GAP;

  const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

  const containerWidth = Math.min(screenWidth, theme.breakpoints.desktop);

  const carouselItems = [
    {
      id: 'todo-list',
      component: TodoList,
      props: {
        tripId: tripId,
        onAddTodoPress: () => setShowAddTodo(true),
      },
    },
  ];

  const bentoItems = React.useMemo(() => {
    return [
      {
        id: 'carousel',
        element: (
          <BentoCarousel items={carouselItems} width={CARD_WIDTH} height={TALL_CARD_HEIGHT} />
        ),
        height: 'tall' as const,
        position: 'left' as const,
      },
      {
        id: 'trip-stats',
        element: <TripStats />,
        height: 'normal' as const,
        position: 'right' as const,
      },
      {
        id: 'quick-actions',
        element: (
          <QuickActions
            trip={trip}
            setShowInviteModal={setShowInviteModal}
            onWalletPress={() => router.push('/wallet' as any)}
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
    logger.info('Trip Detail Screen', `Setting up WebSocket connection for trip ${tripId}`);
    const manager = WebSocketManager.getInstance();

    const isConnectedBefore = manager.isConnected();
    logger.info(
      'Trip Detail Screen',
      `WebSocket connection status before connect: ${isConnectedBefore ? 'connected' : 'disconnected'}`
    );

    manager
      .connect(tripId, {
        onMessage: (rawEvent: unknown) => {
          const serverEventParseResult = BaseEventSchema.safeParse(rawEvent);
          if (serverEventParseResult.success) {
            const eventData = serverEventParseResult.data;
            if (isServerEvent(eventData)) {
              logger.debug('WS', 'TripDetailScreen: Confirmed ServerEvent', eventData);

              useTripStore.getState().handleTripEvent(eventData);

              if (isChatEvent(eventData)) {
                useChatStore.getState().handleChatEvent(eventData);
              }
            } else {
              logger.warn(
                'WS',
                'TripDetailScreen: Parsed as ServerEvent by Zod, but failed isServerEvent guard:',
                eventData
              );
              const notificationParseResult = ZodNotificationSchema.safeParse(rawEvent);
              if (notificationParseResult.success) {
                const notification = notificationParseResult.data;
                logger.debug(
                  'WS',
                  'TripDetailScreen: Fallback - Received Notification after ServerEvent parse mismatch',
                  notification
                );
                useNotificationStore.getState().handleIncomingNotification(notification);
              } else {
                logger.error(
                  'WS',
                  'TripDetailScreen: Unknown event structure after failing ServerEvent specific guard:',
                  rawEvent
                );
              }
            }
            return;
          }

          const notificationParseResult = ZodNotificationSchema.safeParse(rawEvent);
          if (notificationParseResult.success) {
            const notification = notificationParseResult.data;
            logger.debug('WS', 'TripDetailScreen: Received Notification', notification);
            useNotificationStore.getState().handleIncomingNotification(notification);
            return;
          }

          // Handle connection acknowledgment events from server (not an error)
          if (typeof rawEvent === 'object' && rawEvent !== null && 'type' in rawEvent) {
            const eventType = (rawEvent as { type: string }).type;
            if (eventType === 'connected' || eventType === 'pong') {
              logger.debug('WS', `TripDetailScreen: Received ${eventType} event`, rawEvent);
              return;
            }
          }

          logger.error(
            'WS',
            'TripDetailScreen: Received completely unknown event from WebSocket',
            rawEvent
          );
        },
      })
      .then(() => {
        const isConnectedAfter = manager.isConnected();
        logger.info(
          'UI',
          `WebSocket connection status after connect: ${isConnectedAfter ? 'connected' : 'disconnected'}`
        );
      })
      .catch((error) => {
        logger.error('UI', `Failed to connect to WebSocket for trip ${tripId}:`, error);
      });

    connectToChat(tripId);
    fetchMessages(tripId);

    if (isLocationSharingEnabled) {
      startLocationTracking(tripId);
    }
  }, [tripId, connectToChat, fetchMessages]);

  // Location tracking (independent of realtime system)
  useEffect(() => {
    if (isLocationSharingEnabled) {
      logger.info(
        'TripDetailScreen',
        `Starting location tracking for trip ${tripId} (state change)`
      );
      startLocationTracking(tripId);
    } else {
      logger.info(
        'TripDetailScreen',
        `Stopping location tracking for trip ${tripId} (state change)`
      );
      stopLocationTracking();
    }
  }, [isLocationSharingEnabled, tripId, startLocationTracking, stopLocationTracking]);

  // Handle connection errors
  if (connectionError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Connection Error</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>{connectionError}</Text>
        <Button
          mode="contained"
          onPress={() => {
            setConnectionError(null);
            // Trigger reconnection
            const manager = WebSocketManager.getInstance();
            manager
              .connect(tripId, {
                onMessage: () => {},
              })
              .catch((err) => {
                setConnectionError(err.message || 'Failed to reconnect');
              });
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
      <TripDetailHeader trip={trip} onBack={() => router.back()} containerWidth={containerWidth} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.contentContainer, { maxWidth: containerWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <BentoGrid items={bentoItems} />
      </ScrollView>

      <AddTodoModal visible={showAddTodo} onClose={() => setShowAddTodo(false)} tripId={tripId} />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
      />
    </SafeAreaView>
  );
}
