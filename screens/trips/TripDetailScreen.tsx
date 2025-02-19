import React, { useEffect, useState, useCallback} from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Surface, Text, IconButton } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripHeader } from '@/components/trips/TripHeader';
import { Theme } from '@/src/theme/types';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { TodoList } from '@/components/todo/TodoList';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { Trip } from '@/src/types/trip';
import { ServerEvent } from '@/src/types/events';
import { AddTodoModal } from '@/components/todo/AddTodoModal';
import { useTripStore } from '@/src/store/useTripStore';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import { useTodoStore } from '@/src/store/useTodoStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { InviteModal } from '@/components/trips/InviteModal';
import LinearGradient from 'react-native-linear-gradient';

const QuickActions = ({ setShowAddTodo, setShowInviteModal, trip }) => {
  const { theme } = useTheme();
  const authStore = useAuthStore();
  const userId = authStore.user?.id;
  const isOwner = trip.createdBy === userId;
  const isAdmin = trip.members?.some(
    (member) => member.userId === userId && member.role === 'admin'
  );
  const isOwnerOrAdmin = isOwner || isAdmin;

  const actions = [
    { icon: 'map-marker', label: 'Location', onPress: () => console.log('Location pressed') },
    { icon: 'message-outline', label: 'Chat', onPress: () => console.log('Chat pressed') },
    { icon: 'account-group', label: 'Members', onPress: () => console.log('Members pressed') },
    ...(isOwnerOrAdmin
      ? [
          { 
            icon: 'account-plus', 
            label: 'Invite', 
            onPress: () => setShowInviteModal(true) 
          }
        ]
      : []),
    { icon: 'plus', label: 'Add Todo', onPress: () => setShowAddTodo(true) },
  ];

  return (
    <Surface style={styles(theme).actionsCard} elevation={0}>
      <View style={styles(theme).fadeContainer}>
        {/* Left Fade */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
          style={styles(theme).fadeLeft}
          pointerEvents="none"
        />
        
        {/* Scrollable Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles(theme).actionButtons}
        >
          {actions.map((action) => (
            <Pressable 
              key={action.label} 
              onPress={action.onPress}
              style={({ pressed }) => [
                styles(theme).actionItem,
                { opacity: pressed ? 0.6 : 1 }
              ]}
            >
              <View style={styles(theme).iconContainer}>
                <IconButton
                  icon={action.icon}
                  size={20}
                  iconColor={theme.colors.content.primary}
                  style={styles(theme).icon}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Right Fade */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
          style={styles(theme).fadeRight}
          pointerEvents="none"
        />
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
  const { id: tripId } = trip;
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const GRID_MARGIN = theme.spacing.layout.screen.padding;
  const GRID_GAP = theme.spacing.layout.section.gap;
  const MAX_WIDTH = Math.min(screenWidth, theme.breakpoints.desktop);
  const CONTENT_WIDTH = MAX_WIDTH - GRID_MARGIN * 2;

  const BASE_CARD_HEIGHT = 180;
  const TALL_CARD_HEIGHT = BASE_CARD_HEIGHT * 2 + GRID_GAP;
  const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;
  
  // Add container width calculation
  const containerWidth = Math.min(
    screenWidth, 
    theme.breakpoints.desktop
  );
  const carouselItems = [
    {
        id: 'todo-list',
        component: TodoList,
        props: { 
          tripId: tripId,
          onAddTodoPress: () => setShowAddTodo(true)
        }, 
    },
    // Other carousel items can be added here
];

const bentoItems = React.useMemo(
  () => [
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
        element: <QuickActions setShowAddTodo={setShowAddTodo} setShowInviteModal={setShowInviteModal} trip={trip} />,
        height: 'short' as const,
        position: 'right' as const,
    },
], [carouselItems, trip]);


React.useEffect(() => {
  console.log('TripDetailScreen mounted with dimensions:', {
    screenWidth,
    GRID_MARGIN,
    GRID_GAP,
    MAX_WIDTH,
    CONTENT_WIDTH,
    CARD_WIDTH,
    TALL_CARD_HEIGHT,
  });
}, []);

useEffect(() => {
  const manager = WebSocketManager.getInstance();
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
      {/* Connection Status Banner */}
      {/* {error && (
        <Surface style={styles(theme).errorBanner}>
          <Text style={styles(theme).errorText}>{error}</Text>
          {showWarning && (
            <Text style={styles(theme).warningText}>
              Connection will close in 5 seconds
            </Text>
          )}
        </Surface>
      )} */}

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
    padding: theme.spacing.inset.xl,
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
    marginTop: theme.spacing.stack.md,
  },
  destination: {
    ...theme.typography.display.small,
    color: theme.colors.content.primary,
    lineHeight: 48,
  },
  dateContainer: {
    marginVertical: theme.spacing.stack.xl,
  },
  date: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.secondary,
    lineHeight: 32,
  },
  description: {
    color: theme.colors.content.secondary,
    opacity: 0.8,
  },
  actionTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.lg,
  },
  fadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.inset.md,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  actionsCard: {
    paddingVertical: theme.spacing.inset.sm,
    backgroundColor: theme.colors.surface.default,
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.inset.sm,
  },
  actionItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.stack.sm,
  },
  iconContainer: {
    width: 36,
    height: 36, 
    borderRadius: 18,
    backgroundColor: theme.colors.surface.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.content.primary,
  },
  icon: {
    margin: 0,
  },
  actionLabel: {
    ...theme.typography.body.small,
    color: theme.colors.content.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    padding: theme.spacing.inset.lg,
    height: '100%',
    backgroundColor: theme.colors.surface.variant,
  },
  statsTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    marginBottom: theme.spacing.stack.md,
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
  errorBanner: {
    padding: theme.spacing.stack.md,
    margin: theme.spacing.stack.md,
    backgroundColor: theme.colors.status.error.background,
  },
  errorText: {
    color: theme.colors.primary.main,
  },
  warningText: {
    color: theme.colors.primary.main,
    marginTop: theme.spacing.stack.sm,
  },
});