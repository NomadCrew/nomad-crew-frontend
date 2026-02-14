import React from 'react';
import { View, ImageBackground, StyleSheet, Pressable, TextStyle, Dimensions } from 'react-native';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { format } from 'date-fns';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import type { Trip } from '@/src/features/trips/types';
import { WeatherIcon } from '@/src/components/ui/WeatherIcon';
import { WeatherCondition } from '@/src/utils/weather';
import { TripStatusBadge } from './TripStatusBadge';
import { Theme } from '@/src/theme/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Scale: 48px on 430pt (iPhone Pro Max), ~36px on 375pt (iPhone SE/Mini)
const TITLE_FONT_SIZE = Math.round(SCREEN_WIDTH * 0.112);

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onBookmark?: () => void;
  containerWidth?: number; // Added for consistency with TripDetailScreen import
}

export const TripDetailHeader = ({
  // Renamed export
  trip,
  onBack,
  onBookmark,
}: TripHeaderProps) => {
  const theme = useAppTheme().theme;
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

        <View style={styles(theme).bottomSection}>
          <View style={styles(theme).infoContainer}>
            <ThemedText
              style={styles(theme).cityName}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {trip.name}
            </ThemedText>

            <ThemedText variant="body.medium" style={styles(theme).dateText}>
              {startDateString} – {endDateString}
            </ThemedText>
          </View>

          {/* Status + weather badges — inside the hero image */}
          <View style={styles(theme).badgeRow}>
            <View style={styles(theme).badge}>
              <TripStatusBadge status={trip.status} size="medium" />
            </View>

            <View style={styles(theme).badge}>
              <ThemedText variant="body.medium" style={styles(theme).tempText}>
                {temperature}
              </ThemedText>
              <WeatherIcon
                condition={weatherCondition}
                fallback="clear"
                size={20}
                color={theme.colors.content.onImage}
              />
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
      height: 260,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.inset.md,
      paddingTop: theme.spacing.inset.xl,
      paddingBottom: theme.spacing.inset.md,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    bottomSection: {
      gap: theme.spacing.stack.sm,
    },
    infoContainer: {
      alignItems: 'flex-end',
    },
    cityName: {
      fontSize: TITLE_FONT_SIZE,
      lineHeight: TITLE_FONT_SIZE * 1.15,
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
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.stack.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 16,
    },
    tempText: {
      marginRight: 6,
      textShadowColor: 'rgba(0,0,0,0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      color: theme.colors.content.onImage,
      fontSize: 14,
      fontWeight: '500',
    } as TextStyle,
  });
