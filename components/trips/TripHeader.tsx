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
import { ThemedText } from '@/components/ThemedText';
import type { Trip } from '@/src/types/trip';
import { WeatherIcon } from '../ui/WeatherIcon';
import { WeatherCondition } from '@/src/utils/weather';

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onBookmark?: () => void;
}

export const TripHeader = ({
  trip,
  onBack,
  onBookmark,
}: TripHeaderProps) => {
  const { theme } = useTheme();
  const startDateString = format(new Date(trip.startDate), 'MMM dd');
  const endDateString = format(new Date(trip.endDate), 'MMM dd');
  const weatherCondition = trip.weatherCondition as WeatherCondition | undefined;
  const temperature = trip.weatherTemp ?? '-5°C';

  return (
    <ImageBackground
      source={{ uri: trip.backgroundImageUrl }}
      style={styles(theme).backgroundImage}
      resizeMode="cover"
    >
      {/* <View style={styles(theme).overlay} /> */}

      <View style={styles(theme).container}>
        <View style={styles(theme).topRow}>
          <Pressable onPress={onBack} style={styles(theme).backButton}>
            <ArrowLeft size={24} />
          </Pressable>

          {onBookmark && (
            <Pressable onPress={onBookmark} style={styles(theme).iconButton}>
              <Bookmark size={24} color={theme.colors.content.onImage} />
            </Pressable>
          )}
        </View>

        <View style={styles(theme).infoContainer}>
          {/*
            Using a "display.large" variant for a big city name,
            or you could use "heading.h1" if you prefer the standard heading scale.
          */}
          <ThemedText variant="display.large" style={styles(theme).cityName}>
            {trip.name}
          </ThemedText>

          <ThemedText
            variant="body.medium"
            style={styles(theme).dateText}
          >
            {startDateString} – {endDateString}
          </ThemedText>

          <View style={styles(theme).weatherRow}>
            <ThemedText variant="body.medium" style={styles(theme).tempText}>
              {temperature}
            </ThemedText>
            <WeatherIcon condition={weatherCondition} fallback="clear" />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    backgroundImage: {
      width: '100%',
      height: 250,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
    },
    container: {
      flex: 1,
      position: 'relative',
      paddingHorizontal: theme.spacing.inset.md,
      paddingTop: theme.spacing.inset.xl,
      paddingBottom: theme.spacing.inset.md,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.sm,
    },
    backButtonIcon: {
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
    },    
    iconButton: {
      padding: theme.spacing.inset.xs,
    },
    infoContainer: {
      marginTop: theme.spacing.stack.xs,
      alignItems: 'flex-end',
    },
    cityName: {
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      color: theme.colors.content.onImage,
      mixBlendMode: 'difference',
    } as TextStyle,
    dateText: {
      textAlign: 'right',
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
      backgroundBlendMode: 'difference',
    } as TextStyle,
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.stack.xs,
    },
    tempText: {
      marginRight: theme.spacing.stack.md,
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
      mixBlendMode: 'difference',
    } as TextStyle,
  });
