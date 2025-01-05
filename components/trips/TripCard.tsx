import React, { useState } from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';

interface TripCardProps {
  trip: {
    id: number;
    name: string;
    description?: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    participantCount?: number;
  };
  onPress?: () => void;
  expanded?: boolean;
  style?: StyleSheet.StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed ? 0.98 : 1) }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.container, style, animatedStyle]}
    >
      {/* Title and Status */}
      <ThemedView style={styles.header}>
        <ThemedText 
          style={styles.title}
          numberOfLines={1}
        >
          {trip.name}
        </ThemedText>
        
        <ThemedText style={styles.status}>
          PAST
        </ThemedText>
      </ThemedView>

      {/* Info Rows */}
      <ThemedView style={styles.detailsContainer}>
        <ThemedView style={styles.infoRow}>
          <MapPin 
            size={18} 
            color="#9CA3AF"  // Matching the screenshot's gray
            strokeWidth={1.5}
          />
          <ThemedText style={styles.infoText}>
            {trip.destination}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.infoRow}>
          <Calendar 
            size={18} 
            color="#9CA3AF"
            strokeWidth={1.5}
          />
          <ThemedText style={styles.infoText}>
            {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
          </ThemedText>
        </ThemedView>

        {trip.participantCount && (
          <ThemedView style={styles.infoRow}>
            <Users 
              size={18} 
              color="#9CA3AF"
              strokeWidth={1.5}
            />
            <ThemedText style={styles.infoText}>
              {trip.participantCount} participants
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161922', // Matching the dark navy from screenshot
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  status: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#9CA3AF', // Matching the screenshot's text color
    flex: 1,
  },
});