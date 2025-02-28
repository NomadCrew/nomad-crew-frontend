import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, Pressable, Alert } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLocationStore } from '@/src/store/useLocationStore';
import { Theme } from '@/src/theme/types';
import { MapPin, Info, AlertCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { logger } from '@/src/utils/logger';

// Default fallback colors
const DEFAULT_COLORS = {
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
  surfaceVariant: '#E5E7EB'
};

// Helper functions for safely getting theme colors with fallbacks
const getSafeColor = (themeColor: any, fallback: string): string => {
  return themeColor || fallback;
};

export const LocationSharingToggle: React.FC = () => {
  const { theme } = useTheme();
  const { isLocationSharingEnabled, setLocationSharingEnabled } = useLocationStore();
  const [isToggling, setIsToggling] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        logger.debug('Checking location permissions');
        const { status } = await Location.getForegroundPermissionsAsync();
        logger.debug('Location permission status:', status);
        setPermissionStatus(status);
      } catch (error) {
        logger.error('Error checking location permissions:', error);
        setErrorMessage('Unable to check location permissions');
      }
    };

    checkPermissions();
  }, []);

  // Log when location sharing status changes
  useEffect(() => {
    logger.debug('Location sharing enabled state:', isLocationSharingEnabled);
  }, [isLocationSharingEnabled]);

  const handleToggleLocationSharing = async (value: boolean) => {
    setIsToggling(true);
    setErrorMessage(null);
    
    try {
      logger.debug('Toggling location sharing to:', value);
      
      if (value) {
        // Check if location permission is granted
        const { status } = await Location.getForegroundPermissionsAsync();
        logger.debug('Current permission status:', status);
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          // Request permission
          logger.debug('Requesting location permission');
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          logger.debug('New permission status:', newStatus);
          setPermissionStatus(newStatus);
          
          if (newStatus !== 'granted') {
            // Permission denied, show alert
            logger.debug('Permission denied, showing alert');
            Alert.alert(
              'Location Permission Required',
              'To share your location with trip members, please enable location permissions in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings() 
                }
              ]
            );
            setIsToggling(false);
            return;
          }
        }

        // Check if location services are enabled
        logger.debug('Checking if location services are enabled');
        const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
        logger.debug('Location services enabled:', isLocationServicesEnabled);
        
        if (!isLocationServicesEnabled) {
          logger.debug('Location services disabled, showing alert');
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings to share your location.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings() 
              }
            ]
          );
          setIsToggling(false);
          return;
        }
      }
      
      // Update location sharing preference
      logger.debug('Updating location sharing preference to:', value);
      await setLocationSharingEnabled(value);
      logger.debug('Location sharing preference updated successfully');
    } catch (error) {
      logger.error('Error toggling location sharing:', error);
      setErrorMessage('Failed to update location sharing preference. Please try again.');
      Alert.alert(
        'Error',
        'Failed to update location sharing preference. Please try again.'
      );
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
  const getPrimaryColor = () => {
    return getSafeColor(theme?.colors?.primary?.main, DEFAULT_COLORS.primary);
  };

  const getSecondaryColor = () => {
    return getSafeColor(theme?.colors?.content?.secondary, DEFAULT_COLORS.secondary);
  };

  const getDisabledColor = () => {
    return getSafeColor(theme?.colors?.content?.disabled, DEFAULT_COLORS.disabled);
  };

  const getPrimaryLightColor = () => {
    return getSafeColor(theme?.colors?.primary?.light, DEFAULT_COLORS.primaryLight);
  };

  // Create a styles object with current theme and warning/error colors
  const currentStyles = StyleSheet.create({
    container: {
      backgroundColor: getSafeColor(theme?.colors?.surface?.default, DEFAULT_COLORS.surface),
      margin: theme?.spacing?.inset?.sm || 8,
      borderRadius: theme?.borderRadius?.md || 8,
      borderWidth: 1,
      borderColor: getSafeColor(theme?.colors?.border?.default, DEFAULT_COLORS.border),
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme?.spacing?.inset?.md || 16,
    },
    iconContainer: {
      marginRight: theme?.spacing?.inset?.sm || 8,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme?.typography?.size?.md || 16,
      fontWeight: 'bold',
      color: getSafeColor(theme?.colors?.text?.primary, DEFAULT_COLORS.textPrimary),
    },
    description: {
      fontSize: theme?.typography?.size?.sm || 14,
      color: getSafeColor(theme?.colors?.text?.secondary, DEFAULT_COLORS.textSecondary),
      marginTop: 2,
    },
    warningText: {
      fontSize: theme?.typography?.size?.xs || 12,
      color: getSafeColor(theme?.colors?.warning, DEFAULT_COLORS.warning),
      marginTop: 4,
    },
    errorText: {
      fontSize: theme?.typography?.size?.xs || 12,
      color: getSafeColor(theme?.colors?.error, DEFAULT_COLORS.error),
      marginTop: 4,
    },
    infoButton: {
      padding: theme?.spacing?.inset?.xs || 4,
      marginRight: theme?.spacing?.inset?.sm || 8,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme?.spacing?.inset?.sm || 8,
      borderTopWidth: 1,
      borderTopColor: getSafeColor(theme?.colors?.border?.default, DEFAULT_COLORS.border),
    },
    settingsButtonText: {
      fontSize: theme?.typography?.size?.sm || 14,
      color: getSafeColor(theme?.colors?.primary?.main, DEFAULT_COLORS.primary),
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
          
          {errorMessage && (
            <Text style={currentStyles.errorText}>
              {errorMessage}
            </Text>
          )}
        </View>
        
        <Pressable onPress={showLocationInfo} style={currentStyles.infoButton}>
          <Info size={18} color={getSecondaryColor()} />
        </Pressable>
        
        <Switch
          value={isLocationSharingEnabled}
          onValueChange={handleToggleLocationSharing}
          disabled={isToggling || permissionStatus === 'denied'}
          trackColor={{ 
            false: getSafeColor(theme?.colors?.surface?.variant, DEFAULT_COLORS.surfaceVariant), 
            true: getPrimaryLightColor() 
          }}
          thumbColor={
            isLocationSharingEnabled 
              ? getPrimaryColor() 
              : getDisabledColor()
          }
        />
      </View>
      
      {permissionStatus === 'denied' && (
        <Pressable 
          style={currentStyles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={currentStyles.settingsButtonText}>
            Open Settings to Enable Location
          </Text>
        </Pressable>
      )}
    </Surface>
  );
}; 