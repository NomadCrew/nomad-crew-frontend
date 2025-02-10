import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Text, Platform, ViewStyle, ImageBackground } from 'react-native';
import { differenceInDays, formatDistanceToNow, isAfter, isBefore, format } from 'date-fns';
import { CalendarClock, Users, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripStatusBadge } from './TripStatusBadge';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TripStatus } from '@/src/types/trip';

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    description?: string;
    destination: {
      address: string;
      placeId: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    startDate: string;
    endDate: string;
    participantCount?: number;
    status: TripStatus;
    isGhostCard?: boolean;
    backgroundImageUrl?: string;
  };
  onPress?: () => void;
  expanded?: boolean;
  style?: StyleSheet.StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getTripTiming = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // For Active trips
  if (isBefore(start, now) && isAfter(end, now)) {
    const daysLeft = differenceInDays(end, now);
    return `${daysLeft} days remaining`;
  }
  
  // For Upcoming trips
  if (isAfter(start, now)) {
    return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
  }
  
  // For Past trips
  if (isBefore(end, now)) {
    const duration = differenceInDays(end, start);
    return `${duration} day trip`;
  }
  
  return '';
};

const getDurationString = (startDate: string, endDate: string) => {
  const duration = differenceInDays(new Date(endDate), new Date(startDate));
  return `${duration} day${duration !== 1 ? 's' : ''}`;
};

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

  const styles = makeStyles(theme);
  
  if (trip.isGhostCard) {
    return <View style={[styles.container, styles.ghostCard, style]} />;
  }

  const timing = getTripTiming(trip.startDate, trip.endDate);
  const duration = getDurationString(trip.startDate, trip.endDate);

  const InfoRow = ({ 
    icon: Icon, 
    text, 
    lightText 
  }: { 
    icon: typeof MapPin; 
    text: string; 
    lightText?: boolean 
  }) => (
    <View style={styles.infoRow}>
      <Icon 
        size={18} 
        color={lightText ? "#FFFFFF" : theme.colors.content.secondary}
        strokeWidth={1.5}
      />
      <Text style={[
        styles.infoText, 
        lightText && styles.lightText
      ]}>
        {text}
      </Text>
    </View>
  );

  return (
    <AnimatedPressable
    onPressIn={() => setPressed(true)}
    onPressOut={() => setPressed(false)}
    onPress={onPress}
    style={[styles.container, style, animatedStyle]}
  >
    <ImageBackground
      source={trip.backgroundImageUrl ? { uri: trip.backgroundImageUrl } : require('@/assets/images/splash.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      {/* Overlay for better readability */}
      <View style={styles.overlay}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.title, styles.lightText]} numberOfLines={1}>
            {trip.name}
          </Text>
          <TripStatusBadge status={trip.status} />
        </View>

        {/* Info Section */}
        <View style={styles.detailsContainer}>
          <InfoRow icon={MapPin} text={trip.destination.address} lightText />
          <InfoRow icon={CalendarClock} text={timing} lightText />
          <InfoRow icon={Clock} text={duration} lightText />
          <InfoRow icon={Users} text={`${trip.participantCount || 1} ${(trip.participantCount || 1) !== 1 ? 's' : ''}`} />
        </View>
      </View>
    </ImageBackground>

  </AnimatedPressable>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  ghostCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    borderWidth: 0,
  },
  container: {
    backgroundColor: theme.colors.surface.variant,
    borderRadius: theme.spacing.inset.md,
    marginHorizontal: theme.spacing.inset.md,
    marginVertical: theme.spacing.inset.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.content.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    padding: theme.spacing.inset.md,
    backgroundColor: 'rgba(77, 78, 69, 0.4)', 
    borderRadius: theme.spacing.inset.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.stack.md,
  },
  title: {
    ...theme.typography.heading.h3,
    color: theme.colors.content.primary,
    flex: 1,
    marginRight: theme.spacing.inline.sm,
  },
  detailsContainer: {
    gap: theme.spacing.stack.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.inline.sm,
  },
  infoText: {
    ...theme.typography.body.medium,
    color: theme.colors.content.secondary,
    flex: 1,
  },
  lightText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});