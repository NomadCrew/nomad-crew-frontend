import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Animated, { 
  FadeInDown, 
  FadeIn,
  BounceIn,
} from 'react-native-reanimated';
import { MapPin, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

interface PermissionState {
  location: boolean | null;
  notifications: boolean | null;
}

export default function PermissionsScreen() {
  const { theme } = useTheme();
  const { setFirstTimeDone } = useOnboarding();
  const [permissions, setPermissions] = useState<PermissionState>({
    location: null,
    notifications: null,
  });

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissions(prev => ({
        ...prev,
        location: status === 'granted'
      }));
    } catch (error) {
      setPermissions(prev => ({
        ...prev,
        location: false
      }));
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissions(prev => ({
        ...prev,
        notifications: status === 'granted'
      }));
    } catch (error) {
      setPermissions(prev => ({
        ...prev,
        notifications: false
      }));
    }
  }, []);

  // Check existing permissions on mount
  useEffect(() => {
    async function checkPermissions() {
      const [locationStatus, notificationStatus] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      setPermissions({
        location: locationStatus.status === 'granted',
        notifications: notificationStatus.status === 'granted',
      });
    }

    checkPermissions();
  }, []);

  const handleContinue = async () => {
    await setFirstTimeDone();
    router.replace('/(tabs)');
  };

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const renderPermissionCard = (
    type: keyof PermissionState,
    title: string,
    description: string,
    Icon: typeof MapPin | typeof Bell
  ) => {
    const isGranted = permissions[type];
    const isPending = isGranted === null;
    const isDenied = isGranted === false;

    const requestPermission = type === 'location' 
      ? requestLocationPermission 
      : requestNotificationPermission;

    return (
      <Animated.View 
        entering={FadeInDown.duration(600).delay(type === 'location' ? 0 : 200)}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface.default,
            borderColor: isGranted 
              ? theme.colors.status.success.border 
              : isDenied 
                ? theme.colors.status.error.border
                : theme.colors.border.default,
          }
        ]}
      >
        <ThemedView style={styles.cardHeader}>
          <Icon 
            size={24} 
            color={isGranted 
              ? theme.colors.status.success.content
              : theme.colors.primary.main} 
          />
          <ThemedText style={styles.cardTitle}>
            {title}
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.cardDescription}>
          {description}
        </ThemedText>

        {isPending ? (
          <Animated.View 
            entering={FadeIn}
            style={styles.buttonContainer}
          >
            <ThemedView
              style={[styles.button, { backgroundColor: theme.colors.primary.main }]}
              onPress={requestPermission}
            >
              <ThemedText style={styles.buttonText}>
                Enable {type}
              </ThemedText>
            </ThemedView>
          </Animated.View>
        ) : (
          <Animated.View 
            entering={BounceIn}
            style={styles.statusContainer}
          >
            {isGranted ? (
              <CheckCircle2 
                size={24} 
                color={theme.colors.status.success.content}
              />
            ) : (
              <XCircle 
                size={24} 
                color={theme.colors.status.error.content}
              />
            )}
            <ThemedText
              style={[
                styles.statusText,
                {
                  color: isGranted 
                    ? theme.colors.status.success.content
                    : theme.colors.status.error.content
                }
              ]}
            >
              {isGranted ? 'Enabled' : 'Disabled'}
            </ThemedText>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // Both permissions have been decided (either granted or denied)
  const canContinue = permissions.location !== null && permissions.notifications !== null;

  const hasAnyDenied = permissions.location === false || permissions.notifications === false;

  return (
    <ThemedView style={styles.container}>
      <Animated.View 
        entering={FadeInDown.duration(800)}
        style={styles.header}
      >
        <ThemedText style={styles.title}>
          Just a few things...
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          NomadCrew needs a couple of permissions to work its magic
        </ThemedText>
      </Animated.View>

      <ThemedView style={styles.cardContainer}>
        {renderPermissionCard(
          'location',
          'Location Services',
          'Share your location with your travel group when you want to',
          MapPin
        )}

        {renderPermissionCard(
          'notifications',
          'Stay Updated',
          'Get notified about important trip updates and messages',
          Bell
        )}
      </ThemedView>

      {canContinue && (
        <Animated.View 
          entering={FadeIn.duration(400)}
          style={styles.footer}
        >
          {hasAnyDenied && (
            <ThemedText 
              style={styles.settingsText}
              onPress={openSettings}
            >
              Open settings to enable permissions
            </ThemedText>
          )}

          <ThemedView
            style={[
              styles.continueButton,
              { backgroundColor: theme.colors.primary.main }
            ]}
            onPress={handleContinue}
          >
            <ThemedText style={styles.continueButtonText}>
              Continue to NomadCrew
            </ThemedText>
          </ThemedView>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  cardContainer: {
    gap: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: 'flex-start',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
  },
  settingsText: {
    textAlign: 'center',
    marginBottom: 16,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});