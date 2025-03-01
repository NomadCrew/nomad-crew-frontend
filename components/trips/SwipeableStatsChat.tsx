import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { BentoCarousel } from '@/components/ui/BentoCarousel';
import { TripStats } from './TripStats';
import { ChatCard } from '@/components/chat/ChatCard';
import { Surface } from 'react-native-paper';

interface SwipeableStatsChatProps {
  tripId: string;
  onChatPress: () => void;
  width: number;
  height: number;
}

export const SwipeableStatsChat: React.FC<SwipeableStatsChatProps> = ({
  tripId,
  onChatPress,
  width,
  height,
}) => {
  const { theme } = useTheme();

  // Create a minimized version of each component to fit in the normal height card
  const MinimizedTripStats = () => (
    <Surface style={styles(theme).statsCard} elevation={0}>
      <TripStats />
    </Surface>
  );

  const MinimizedChatCard = () => (
    <Surface style={styles(theme).chatCard} elevation={0}>
      <ChatCard tripId={tripId} onPress={onChatPress} />
    </Surface>
  );

  const carouselItems = [
    {
      id: 'trip-stats',
      component: MinimizedTripStats,
      props: {},
    },
    {
      id: 'chat-card',
      component: MinimizedChatCard,
      props: {},
    },
  ];

  return (
    <View style={styles(theme).container}>
      <BentoCarousel
        items={carouselItems}
        width={width}
        height={height}
      />
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statsCard: {
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.surface.variant,
    borderRadius: 24,
  },
  chatCard: {
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.surface.variant,
    borderRadius: 24,
  },
}); 