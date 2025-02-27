// screens/trips/TripDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/components/todo/TodoList';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/types/trip';
import { AddTodoModal } from '@/components/todo/AddTodoModal';
import { InviteModal } from '@/components/trips/InviteModal';
import { WebSocketManager, wsManager } from '@/src/websocket/WebSocketManager';
import { useTripStore } from '@/src/store/useTripStore';
import { useTodoStore } from '@/src/store/useTodoStore';
import { TripDetailHeader } from '@/components/trips/TripDetailHeader';
import { QuickActions } from '@/components/trips/QuickActions';
import { TripStats } from '@/components/trips/TripStats';
import { Theme } from '@/src/theme/types';
import { logger } from '@/src/utils/logger';
import { StatusBar } from 'expo-status-bar';

interface TripDetailScreenProps {
  trip: Trip;
}

export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  const { id: tripId } = trip;
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

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
        id: '2',
        element: <TripStats />,
        height: 'normal' as const,
        position: 'right' as const,
      },
      {
        id: '3',
        element: (
          <QuickActions 
            trip={trip}
            setShowInviteModal={setShowInviteModal} 
          />
        ),
        height: 'short' as const,
        position: 'right' as const,
      },
    ];
  }, [carouselItems, trip, CARD_WIDTH, TALL_CARD_HEIGHT, setShowInviteModal]);

  useEffect(() => {
    const manager = wsManager as WebSocketManager;
    manager.connect(tripId, {
      onMessage: (event) => {
        useTripStore.getState().handleTripEvent(event);
        useTodoStore.getState().handleTodoEvent(event);
      }
    });

    return () => manager.disconnect();
  }, [tripId]);

  return (
    <View style={styles(theme).container}>
      <StatusBar style="light" />
      <TripDetailHeader 
        trip={trip} 
        onBack={() => router.back()} 
        containerWidth={containerWidth}
      />

      <ScrollView
        style={styles(theme).scrollContainer}
        contentContainerStyle={[
          styles(theme).contentContainer,
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
    </View>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: theme.spacing.stack.xl,
  },
});