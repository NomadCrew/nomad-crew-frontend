import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, useWindowDimensions, SafeAreaView, Text, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/src/features/todos/components/TodoList';
import { PollListCompact } from '@/src/features/polls/components/PollListCompact';
import { PollDetailSheet } from '@/src/features/polls/components/PollDetailSheet';
import { PollCreator } from '@/src/features/polls/components/PollCreator';
import type { PollResponse } from '@/src/features/polls/types';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/features/trips/types';
import { AddTodoModal } from '@/src/features/todos/components/AddTodoModal';
import { InviteModal } from '@/src/features/trips/components/InviteModal';
import { MemberManagementModal } from '@/src/features/trips/components/MemberManagementModal';
import { TripStatusUpdateModal } from '@/src/features/trips/components/TripStatusUpdateModal';
import { useTripStore } from '@/src/features/trips/store';
import { useAuthStore } from '@/src/features/auth/store';
import { useLocationStore } from '@/src/features/location/store/useLocationStore';
import { TripDetailHeader } from '@/src/features/trips/components/TripDetailHeader';
import { QuickActions } from '@/src/features/trips/components/QuickActions';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from '@/src/features/chat/store';
import { TripStats } from '@/src/features/trips/components/TripStats';
import { useThemedStyles } from '@/src/theme/utils';
import { WebSocketManager } from '@/src/features/websocket/WebSocketManager';
import { BaseEventSchema, isChatEvent, isServerEvent } from '@/src/types/events';
import { logger } from '@/src/utils/logger';
import { useTripPermissions } from '@/src/features/auth/permissions';
import { useTripWeather } from '@/src/features/trips/hooks';
import { useResponsiveLayout } from '@/src/hooks';

interface TripDetailScreenProps {
  trip: Trip;
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { id: tripId } = trip;
  const { theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { containerWidth } = useResponsiveLayout();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<PollResponse | null>(null);
  const [showPollDetail, setShowPollDetail] = useState(false);
  const authStore = useAuthStore();
  const { isLocationSharingEnabled, startLocationTracking, stopLocationTracking } =
    useLocationStore();
  const { connectToChat, fetchMessages } = useChatStore();

  // Set up permission context for this trip (unused vars prefixed with _)
  const {
    can: _can,
    isAdminOrOwner: _isAdminOrOwner,
    isOwner: _isOwner,
  } = useTripPermissions({ trip });

  const { data: weather } = useTripWeather(tripId);

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
  const CONTENT_WIDTH = containerWidth - GRID_MARGIN * 2;

  const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

  // Scale card heights proportionally to width for consistent aspect ratios on tablet
  const BASE_CARD_HEIGHT = Math.max(180, Math.round(CARD_WIDTH * 0.55));
  const TALL_CARD_HEIGHT = BASE_CARD_HEIGHT * 2 + GRID_GAP;

  const handlePollPress = useCallback((poll: PollResponse) => {
    setSelectedPoll(poll);
    setShowPollDetail(true);
  }, []);

  const carouselItems = [
    {
      id: 'todo-list',
      component: TodoList,
      props: {
        tripId: tripId,
        onAddTodoPress: () => setShowAddTodo(true),
      },
    },
    {
      id: 'poll-list',
      component: PollListCompact,
      props: {
        tripId: tripId,
        onCreatePress: () => setShowCreatePoll(true),
        onPollPress: handlePollPress,
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
        element: <TripStats trip={trip} tripId={tripId} />,
        height: 'normal' as const,
        position: 'right' as const,
      },
      {
        id: 'quick-actions',
        element: (
          <QuickActions
            trip={trip}
            setShowInviteModal={setShowInviteModal}
            setShowMemberModal={setShowMemberModal}
            setShowStatusModal={setShowStatusModal}
            onWalletPress={() => router.push('/wallet' as any)}
            onExpensesPress={() => router.push(`/expenses/${tripId}` as any)}
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
  }, [
    carouselItems,
    trip,
    tripId,
    CARD_WIDTH,
    TALL_CARD_HEIGHT,
    setShowInviteModal,
    setShowMemberModal,
    setShowStatusModal,
  ]);

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
            }
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

          // Notification events are handled by WebSocketManager globally,
          // not by TripDetailScreen
          logger.debug(
            'WS',
            'TripDetailScreen: Ignoring non-ServerEvent message (handled elsewhere)',
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
      <TripDetailHeader
        trip={trip}
        weather={weather}
        onBack={() => router.back()}
        containerWidth={containerWidth}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.contentContainer, { maxWidth: containerWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <BentoGrid items={bentoItems} />
      </ScrollView>

      <AddTodoModal visible={showAddTodo} onClose={() => setShowAddTodo(false)} tripId={tripId} />

      <PollCreator
        tripId={tripId}
        visible={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
      />

      <PollDetailSheet
        tripId={tripId}
        poll={selectedPoll}
        visible={showPollDetail}
        onClose={() => setShowPollDetail(false)}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
      />

      <MemberManagementModal
        visible={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        trip={(() => {
          const tripCopy = { ...trip };
          if (!tripCopy.members) {
            tripCopy.members = [];
          }

          const userId = authStore.user?.id;
          const getUserDisplayName = (user: any): string => {
            if (!user) return 'Trip Member';
            if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
            if (user.firstName) return user.firstName;
            if (user.lastName) return user.lastName;
            if (user.username && user.username.trim() !== '') return user.username;
            if (user.email) {
              const emailName = user.email.split('@')[0];
              const separator = emailName.includes('.') ? '.' : emailName.includes('_') ? '_' : '';
              if (separator) {
                return emailName
                  .split(separator)
                  .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
                  .join(' ');
              }
              return emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
            return 'Trip Member';
          };

          // Ensure creator is in members
          if (!tripCopy.members.some((m) => m.userId === trip.createdBy)) {
            const creatorName =
              authStore.user && authStore.user.id === trip.createdBy
                ? getUserDisplayName(authStore.user)
                : undefined;
            tripCopy.members.push({
              userId: trip.createdBy,
              name: creatorName,
              role: 'owner',
              joinedAt: trip.createdAt,
            });
          }

          // Ensure current user is in members
          if (userId && !tripCopy.members.some((m) => m.userId === userId)) {
            tripCopy.members.push({
              userId,
              name: authStore.user ? getUserDisplayName(authStore.user) : undefined,
              role: userId === trip.createdBy ? 'owner' : 'member',
              joinedAt: new Date().toISOString(),
            });
          }

          // Fill in missing names
          if (!Array.isArray(tripCopy.members)) tripCopy.members = [];
          tripCopy.members = tripCopy.members.map((member) => {
            if (!member.name) {
              if (member.userId === userId && authStore.user) {
                return { ...member, name: getUserDisplayName(authStore.user) };
              }
              return { ...member, name: `Member ${member.userId.substring(0, 4)}` };
            }
            return member;
          });

          return tripCopy;
        })()}
      />

      <TripStatusUpdateModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        trip={trip}
      />
    </SafeAreaView>
  );
}
