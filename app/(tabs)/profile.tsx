import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Alert, Linking, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { Switch, Button } from 'react-native-paper';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/src/features/auth/store';
import {
  SectionHeader,
  SettingsRow,
  LocationPrivacySelector,
  TripStats,
  FeedbackModal,
} from '@/src/components/profile';
import { useTrips } from '@/src/features/trips/hooks';
import { computeTripStats } from '@/src/features/trips/utils/computeTripStats';
import {
  updateLocationPrivacy,
  updateUserPreferences,
  fetchUserProfile,
  type LocationPrivacyLevel,
} from '@/src/features/users';
import { useThemedStyles } from '@/src/theme/utils';
import { useResponsiveLayout } from '@/src/hooks';
import { logger } from '@/src/utils/logger';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { containerWidth } = useResponsiveLayout();
  const { user, signOut, setUser } = useAuthStore();

  // Local state
  const [locationPrivacy, setLocationPrivacy] = useState<LocationPrivacyLevel>('hidden');
  const [ghostMode, setGhostMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  // Compute trip stats from real data via shared utility
  const { data: tripsData } = useTrips();
  const tripStats = useMemo(() => computeTripStats(tripsData ?? []), [tripsData]);

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors?.background?.default ?? '#F9FAFB',
    },
    scrollContent: {
      paddingBottom: insets.bottom + 32,
    },
    heroSection: {
      alignItems: 'center' as const,
      paddingVertical: theme.spacing?.inset?.lg ?? 24,
      paddingHorizontal: theme.spacing?.inset?.md ?? 16,
    },
    avatarContainer: {
      marginBottom: theme.spacing?.stack?.md ?? 16,
    },
    nameText: {
      marginBottom: theme.spacing?.stack?.xs ?? 4,
    },
    usernameText: {
      marginBottom: theme.spacing?.stack?.xs ?? 4,
    },
    joinedText: {
      marginTop: theme.spacing?.stack?.sm ?? 8,
    },
    signOutButton: {
      marginHorizontal: theme.spacing?.inset?.md ?? 16,
      marginTop: theme.spacing?.stack?.lg ?? 24,
    },
    deleteAccountContainer: {
      alignItems: 'center' as const,
      paddingVertical: theme.spacing?.inset?.md ?? 16,
    },
    deleteAccountText: {
      color: theme.colors?.status?.error?.main ?? '#EF4444',
    },
    privacySelectorContainer: {
      marginTop: theme.spacing?.stack?.sm ?? 8,
    },
    primaryColor: theme.colors?.primary?.main ?? '#F46315',
  }));

  // Load user preferences on focus
  useFocusEffect(
    useCallback(() => {
      const loadUserProfile = async () => {
        if (!user?.id) return;

        try {
          const profile = await fetchUserProfile();

          // Sync profile data back to auth store (username, firstName, lastName, etc.)
          if (profile.username || profile.firstName || profile.lastName) {
            setUser({
              ...user,
              username: profile.username || user.username,
              firstName: profile.firstName || user.firstName,
              lastName: profile.lastName || user.lastName,
              createdAt: profile.createdAt || user.createdAt,
            });
          }

          if (profile.locationPrivacyPreference) {
            setLocationPrivacy(profile.locationPrivacyPreference);
          }
          if (profile.preferences?.ghostMode !== undefined) {
            setGhostMode(profile.preferences.ghostMode);
          }
        } catch (error) {
          logger.warn('Profile', 'Failed to load user profile', error);
        }
      };

      loadUserProfile();
    }, [user, setUser])
  );

  // Format joined date
  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return null;
    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [user?.createdAt]);

  // Get display name
  const displayName = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.username || 'User';
  }, [user?.firstName, user?.lastName, user?.username]);

  // Handle location privacy change
  const handleLocationPrivacyChange = useCallback(
    async (newLevel: LocationPrivacyLevel) => {
      if (!user?.id || isUpdating) return;

      const previousLevel = locationPrivacy;
      setLocationPrivacy(newLevel); // Optimistic update
      setIsUpdating(true);

      try {
        await updateLocationPrivacy(user.id, newLevel);
        logger.info('Profile', 'Location privacy updated', { level: newLevel });
      } catch (error) {
        logger.error('Profile', 'Failed to update location privacy', error);
        setLocationPrivacy(previousLevel); // Rollback
        Alert.alert('Update Failed', 'Could not update location privacy. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [user?.id, locationPrivacy, isUpdating]
  );

  // Handle ghost mode toggle
  const handleGhostModeToggle = useCallback(
    async (newValue: boolean) => {
      if (!user?.id || isUpdating) return;

      const previousValue = ghostMode;
      setGhostMode(newValue); // Optimistic update
      setIsUpdating(true);

      try {
        await updateUserPreferences(user.id, { ghostMode: newValue });
        logger.info('Profile', 'Ghost mode updated', { ghostMode: newValue });
      } catch (error) {
        logger.error('Profile', 'Failed to update ghost mode', error);
        setGhostMode(previousValue); // Rollback
        Alert.alert('Update Failed', 'Could not update ghost mode. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [user?.id, ghostMode, isUpdating]
  );

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            logger.error('Profile', 'Sign out failed', error);
          }
        },
      },
    ]);
  }, [signOut]);

  // Handle delete account
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'To delete your account and all associated data, please email support@nomadcrew.uk.'
            );
          },
        },
      ]
    );
  }, []);

  const handleOpenLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link.');
    });
  }, []);

  // App version
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  if (!user) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.heroSection}>
          <ThemedText variant="body.medium" color="content.secondary">
            Please sign in to view your profile.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: containerWidth, width: '100%', alignSelf: 'center' as const },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Avatar user={user} size="xl" />
          </View>
          <ThemedText variant="display.small" style={styles.nameText}>
            {displayName}
          </ThemedText>
          <ThemedText variant="body.medium" color="content.secondary" style={styles.usernameText}>
            @{user.username}
          </ThemedText>
          {joinedDate && (
            <ThemedText variant="body.small" color="content.tertiary" style={styles.joinedText}>
              Joined {joinedDate}
            </ThemedText>
          )}
        </View>

        {/* Location Privacy Section */}
        <SectionHeader title="LOCATION SHARING" />
        <View style={styles.privacySelectorContainer}>
          <LocationPrivacySelector
            value={locationPrivacy}
            onChange={handleLocationPrivacyChange}
            disabled={isUpdating}
          />
        </View>

        {/* Ghost Mode Section */}
        <SectionHeader title="GHOST MODE" />
        <SettingsRow
          icon="moon-outline"
          label="Ghost Mode"
          value="Pause all location sharing temporarily"
          showChevron={false}
          rightElement={
            <Switch
              value={ghostMode}
              onValueChange={handleGhostModeToggle}
              disabled={isUpdating}
              color={styles.primaryColor}
            />
          }
        />

        {/* Trip Stats Section */}
        <SectionHeader title="YOUR JOURNEY" />
        <TripStats
          trips={tripStats.completedTrips}
          destinations={tripStats.uniqueDestinations}
          daysTraveled={tripStats.uniqueDaysTraveled}
        />

        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <SettingsRow icon="mail-outline" label="Email" value={user.email} showChevron={false} />
        <SettingsRow
          icon="at-outline"
          label="Username"
          value={`@${user.username}`}
          showChevron={false}
        />

        {/* Support Section */}
        <SectionHeader title="SUPPORT" />
        <SettingsRow
          icon="chatbox-outline"
          label="Send Feedback"
          value="Report bugs or share ideas"
          onPress={() => setFeedbackVisible(true)}
        />
        <SettingsRow
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => handleOpenLink('https://nomadcrew.uk/help')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => handleOpenLink('https://nomadcrew.uk/privacy')}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => handleOpenLink('https://nomadcrew.uk/terms')}
        />
        <SettingsRow
          icon="information-circle-outline"
          label="App Version"
          value={appVersion}
          showChevron={false}
        />

        {/* Sign Out Button */}
        <Button mode="contained" onPress={handleSignOut} style={styles.signOutButton}>
          Sign Out
        </Button>

        {/* Delete Account Link */}
        <View style={styles.deleteAccountContainer}>
          <Pressable onPress={handleDeleteAccount}>
            <ThemedText variant="body.small" style={styles.deleteAccountText}>
              Delete Account
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />
    </ThemedView>
  );
}
