import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Pressable,
  TextStyle,
} from 'react-native';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import type { Trip } from '@/src/features/trips/types';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { WeatherCondition } from '@/src/utils/weather';
import { TripStatusBadge } from './TripStatusBadge';
import { Theme } from '@/src/theme/types';

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onBookmark?: () => void;
  containerWidth?: number; // Added for consistency with TripDetailScreen import
}

export const TripDetailHeader = ({ // Renamed export
  trip,
  onBack,
  onBookmark,
}: TripHeaderProps) => {
  const { theme } = useTheme();
  const startDateString = format(new Date(trip.startDate), 'MMM dd');
  const endDateString = format(new Date(trip.endDate), 'MMM dd');
  const weatherCondition = trip.weatherCondition as WeatherCondition | undefined;
  const temperature = trip.weatherTemp ?? '6°C';

  return (
    <ImageBackground
      source={{ uri: trip.backgroundImageUrl }}
      style={styles(theme).backgroundImage}
      resizeMode="cover"
    >
      <View style={styles(theme).overlay} />

      <View style={styles(theme).container}>
        <View style={styles(theme).topRow}>
          <Pressable 
            onPress={onBack} 
            style={styles(theme).backButton}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 20 }}
          >
            <ArrowLeft size={24} color={theme.colors.content.onImage} />
          </Pressable>

          {onBookmark && (
            <Pressable 
              onPress={onBookmark} 
              style={styles(theme).iconButton}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 20 }}
            >
              <Bookmark size={24} color={theme.colors.content.onImage} />
            </Pressable>
          )}
        </View>

        <View style={styles(theme).infoContainer}>
          <ThemedText variant="display.large" style={styles(theme).cityName}>
            {trip.name}
          </ThemedText>

          <ThemedText
            variant="body.medium"
            style={styles(theme).dateText}
          >
            {startDateString} – {endDateString}
          </ThemedText>

          <View style={styles(theme).statusAndWeatherContainer}>
            <View style={styles(theme).statusContainer}>
              <TripStatusBadge status={trip.status} size="medium" />
            </View>
            
            <View style={styles(theme).weatherRow}>
              <ThemedText variant="body.medium" style={styles(theme).tempText}>
                {temperature}
              </ThemedText>
              <WeatherIcon condition={weatherCondition} fallback="clear" size={24} color={theme.colors.content.onImage} />
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    backgroundImage: {
      width: '100%',
      height: 270,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
      flex: 1,
      position: 'relative',
      paddingHorizontal: theme.spacing.inset.md,
      paddingTop: theme.spacing.inset.xl,
      paddingBottom: theme.spacing.inset.lg,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    infoContainer: {
      marginTop: theme.spacing.stack.md,
      alignItems: 'flex-end',
    },
    cityName: {
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      color: theme.colors.content.onImage,
      fontWeight: 'bold',
    } as TextStyle,
    dateText: {
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
      marginTop: 4,
    } as TextStyle,
    statusAndWeatherContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.stack.sm,
      gap: theme.spacing.stack.sm,
    },
    statusContainer: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    tempText: {
      marginRight: theme.spacing.stack.md,
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
      fontSize: 16,
      fontWeight: '500',
    } as TextStyle,
  }); 