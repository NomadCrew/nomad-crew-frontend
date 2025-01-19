import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Text, Platform, ViewStyle } from 'react-native';
import { format } from 'date-fns';
import { MapPin, Calendar, Users } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripStatusBadge } from './TripStatusBadge';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TripStatus } from '@/src/types/trip';

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    description?: string;
    destination: string;
    startDate: string;
    endDate: string;
    participantCount?: number;
    status: TripStatus;
    isGhostCard?: boolean;
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

  const styles = makeStyles(theme);

  if (trip.isGhostCard) {
    return <View style={[styles.container, styles.ghostCard, style]} />;
  }

  const InfoRow = ({ icon: Icon, text }: { icon: typeof MapPin; text: string }) => (
    <View style={styles.infoRow}>
      <Icon 
        size={18} 
        color={theme.colors.content.secondary}
        strokeWidth={1.5}
      />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );

  return (
    <AnimatedPressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.container, style, animatedStyle]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.name}
        </Text>
        <TripStatusBadge status={trip.status} />
      </View>

      <View style={styles.detailsContainer}>
        <InfoRow 
          icon={MapPin} 
          text={trip.destination} 
        />

        <InfoRow 
          icon={Calendar} 
          text={`${format(new Date(trip.startDate), 'MMM d')} - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`} 
        />

        {trip.participantCount && (
          <InfoRow 
            icon={Users} 
            text={`${trip.participantCount} participants`} 
          />
        )}
      </View>
    </AnimatedPressable>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.variant,
    borderRadius: theme.spacing.inset.md,
    marginHorizontal: theme.spacing.inset.md,
    marginVertical: theme.spacing.inset.sm,
    padding: theme.spacing.inset.md,
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
  ghostCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    borderWidth: 0,
  },
});