import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, Pressable, Alert } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '../store/useLocationStore';
import { Theme } from '@/src/theme/types';
import { MapPin, Info, AlertCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { logger } from '@/src/utils/logger';

// Default fallback colors
const DEFAULT_COLORS: Record<string, string> = {
  primary: '#F46315',
  primaryLight: '#FFB088',
  secondary: '#6B7280',
  disabled: '#D4D4D4',
  warning: '#F59E0B',
  error: '#DC2626',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1A1A1A',
  textSecondary: '#404040',
  surfaceVariant: '#E5E7EB',
};

// Helper functions for safely getting theme colors with fallbacks
const getSafeColor = (themeColor: string | undefined, fallback: string): string => {
  return themeColor || fallback;
};

export const LocationSharingToggle: React.FC = () => {
  const { theme } = useAppTheme();
  const { isLocationSharingEnabled, setLocationSharingEnabled } = useLocationStore();
  const [isToggling, setIsToggling] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        logger.debug('LOCATION', 'Checking location permissions');
        const { status } = await Location.getForegroundPermissionsAsync();
        logger.debug('LOCATION', 'Location permission status:', status);
        setPermissionStatus(status);
      } catch (error) {
        logger.error('LOCATION', 'Error checking location permissions:', error);
        setErrorMessage('Unable to check location permissions');
      }
    };

    checkPermissions();
  }, []);

  // Log when location sharing status changes
  useEffect(() => {
    logger.debug('LOCATION', 'Location sharing enabled state:', isLocationSharingEnabled);
  }, [isLocationSharingEnabled]);

  const handleToggleLocationSharing = async (value: boolean) => {
    setIsToggling(true);
    setErrorMessage(null);

    try {
      logger.debug('LOCATION', 'Toggling location sharing to:', value);

      if (value) {
        // Check if location permission is granted
        const { status } = await Location.getForegroundPermissionsAsync();
        logger.debug('LOCATION', 'Current permission status:', status);
        setPermissionStatus(status);

        if (status !== 'granted') {
          // Request permission
          logger.debug('LOCATION', 'Requesting location permission');
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          logger.debug('LOCATION', 'New permission status:', newStatus);
          setPermissionStatus(newStatus);

          if (newStatus !== 'granted') {
            // Permission denied, show alert
            logger.debug('LOCATION', 'Permission denied, showing alert');
            Alert.alert(
              'Location Permission Required',
              'To share your location with trip members, please enable location permissions in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            setIsToggling(false);
            return;
          }
        }

        // Check if location services are enabled
        logger.debug('LOCATION', 'Checking if location services are enabled');
        const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
        logger.debug('LOCATION', 'Location services enabled:', isLocationServicesEnabled);

        if (!isLocationServicesEnabled) {
          logger.debug('LOCATION', 'Location services disabled, showing alert');
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings to share your location.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          setIsToggling(false);
          return;
        }
      }

      // Update location sharing preference
      logger.debug('LOCATION', 'Updating location sharing preference to:', value);
      await setLocationSharingEnabled(value);
      logger.debug('LOCATION', 'Location sharing preference updated successfully');
    } catch (error) {
      logger.error('LOCATION', 'Error toggling location sharing:', error);
      setErrorMessage('Failed to update location sharing preference. Please try again.');
      Alert.alert('Error', 'Failed to update location sharing preference. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const showLocationInfo = () => {
    Alert.alert(
      'Location Sharing',
      'When enabled, your location will be shared with other trip members. You will also be able to see their locations. Your location is only shared while the app is open and only with members of your trip.',
      [{ text: 'OK' }]
    );
  };

  // Safely get color values with fallbacks
  const getPrimaryColor = (): string => {
    return theme.colors.primary.main ?? DEFAULT_COLORS.primary;
  };

  const getSecondaryColor = (): string => {
    return theme.colors.content.secondary ?? DEFAULT_COLORS.secondary;
  };

  const getDisabledColor = (): string => {
    return theme.colors.content.disabled ?? DEFAULT_COLORS.disabled;
  };

  const getPrimaryLightColor = (): string => {
    return theme.colors.primary.border ?? DEFAULT_COLORS.primaryLight;
  };

  // Create a styles object with current theme and warning/error colors
  const currentStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface.default ?? DEFAULT_COLORS.surface,
      margin: theme.spacing.inset.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default ?? DEFAULT_COLORS.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.inset.md,
    },
    iconContainer: {
      marginRight: theme.spacing.inset.sm,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.size.md,
      fontWeight: 'bold',
      color: theme.colors.content.primary ?? DEFAULT_COLORS.textPrimary,
    },
    description: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.content.secondary ?? DEFAULT_COLORS.textSecondary,
      marginTop: 2,
    },
    warningText: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.status.warning?.content ?? DEFAULT_COLORS.warning,
      marginTop: 4,
    },
    errorText: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.status.error?.content ?? DEFAULT_COLORS.error,
      marginTop: 4,
    },
    infoButton: {
      padding: theme.spacing.inset.xs,
      marginRight: theme.spacing.inset.sm,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.inset.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default ?? DEFAULT_COLORS.border,
    },
    settingsButtonText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.primary.main ?? DEFAULT_COLORS.primary,
      marginLeft: 8,
      fontWeight: '500',
    },
  });

  return (
    <Surface style={currentStyles.container} elevation={0}>
      <View style={currentStyles.content}>
        <View style={currentStyles.iconContainer}>
          <MapPin size={20} color={getPrimaryColor()} />
        </View>

        <View style={currentStyles.textContainer}>
          <Text style={currentStyles.title}>Location Sharing</Text>
          <Text style={currentStyles.description}>
            {isLocationSharingEnabled
              ? 'Your location is being shared with trip members'
              : 'Enable to share your location with trip members'}
          </Text>

          {permissionStatus === 'denied' && (
            <Text style={currentStyles.warningText}>
              Location permission denied. Please enable in settings.
            </Text>
          )}

          {errorMessage && <Text style={currentStyles.errorText}>{errorMessage}</Text>}
        </View>

        <Pressable onPress={showLocationInfo} style={currentStyles.infoButton}>
          <Info size={20} color={getSecondaryColor()} />
        </Pressable>

        <Switch
          trackColor={{
            false: getDisabledColor(),
            true: getPrimaryLightColor(),
          }}
          thumbColor={
            isLocationSharingEnabled
              ? getPrimaryColor()
              : (theme.colors.surface.default ?? DEFAULT_COLORS.surface)
          }
          ios_backgroundColor={getDisabledColor()}
          onValueChange={handleToggleLocationSharing}
          value={isLocationSharingEnabled}
          disabled={isToggling}
        />
      </View>

      {permissionStatus === 'denied' && (
        <Pressable style={currentStyles.settingsButton} onPress={() => Linking.openSettings()}>
          <AlertCircle
            size={16}
            color={theme.colors.status.warning?.content ?? DEFAULT_COLORS.warning}
          />
          <Text style={currentStyles.settingsButtonText}>Open Settings to Enable Location</Text>
        </Pressable>
      )}
    </Surface>
  );
};
