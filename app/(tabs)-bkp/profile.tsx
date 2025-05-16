import React, { useState } from 'react'; // Import useState

import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  View,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import Avatar from '@/components/ui/Avatar';
import { Theme } from '@/src/theme/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { theme, mode, toggleColorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);
  const { user, logout } = useAuthStore();

  // Compute a display name based on available fields.
  const displayName = user
    ? (user.firstName ||
        (user as any).user_metadata?.full_name ||
        (user as any).user_metadata?.name ||
        user.username ||
        'Guest')
    : 'Guest';

  // Prepare the profile object for the Avatar component.
  const profileData = user
    ? {
        firstName:
          user.firstName || (user as any).user_metadata?.name || (user as any).user_metadata?.full_name,
        lastName: user.lastName,
        profilePicture:
          user.profilePicture ||
          (user as any).user_metadata?.avatar_url ||
          (user as any).user_metadata?.picture,
        email: user.email,
        username: user.username,
        appleUser: user.appleUser
      }
    : {};

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Logout Failed', 'An error occurred during logout. Please try again.');
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'This functionality is coming soon.');
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background.default,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.avatarContainer}>
            <Avatar user={profileData} size="xl" style={{ width: 100, height: 100 }} />
          </View>
          <ThemedText style={styles.name}>{displayName}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.detailsContainer}>
          <ProfileDetailRow
            icon="person-outline"
            text={displayName}
            onPress={handleEditProfile}
            isEditable={true} // Mark the username row as editable
          />
          <ProfileDetailRow
            icon="mail-outline"
            text={user?.email || 'No email provided'}
          />
          <ProfileDetailRow
            icon="lock-closed-outline"
            text="******" // Placeholder for password
          />
          <ProfileDetailRow
            icon="location-outline"
            text="Location preference"
            hasSwitch={true}
          />
          <ProfileDetailRow
            icon="help-circle-outline"
            text="Support" // Placeholder
            onPress={() => Alert.alert('Support', 'Coming Soon!')}
            isLast={true} 
          />
          <ProfileDetailRow
            icon="log-out-outline"
            text="Logout"
            onPress={handleLogout}
            isLogout={true}
          />
          <ProfileDetailRow
            icon="contrast-outline"
            text={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            hasSwitch={true}
            value={mode === 'dark'}
            onValueChange={toggleColorScheme}
          />
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const ProfileDetailRow = ({
  icon,
  text,
  onPress,
  isLast = false,
  isLogout = false,
  isEditable = false,
  hasSwitch = false,
  value,
  onValueChange,
}: {
  icon: typeof Ionicons['name'];
  text: string;
  onPress?: () => void;
  isLast?: boolean;
  isLogout?: boolean;
  isEditable?: boolean;
  hasSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [internalValue, setInternalValue] = useState(false);

  const handleValueChange = (newValue: boolean) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const switchValue = value !== undefined ? value : internalValue;

  return (
    <Pressable style={[styles.detailRow, !isLast && styles.detailRowBorder]} onPress={onPress}>
      <Ionicons
        name={icon as typeof Ionicons['name']}
        size={24}
        color={theme.colors.content.secondary}
        style={styles.detailIcon}
      />
      <ThemedText style={[styles.detailText, isLogout && styles.logoutText]}>{text}</ThemedText>
      {isEditable && (
        <Ionicons
          name="pencil-outline"
          size={20}
          color={theme.colors.content.secondary}
        />
      )}
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={handleValueChange}
          trackColor={{
            false: theme.colors.border.default,
            true: theme.colors.primary.main,
          }}
          thumbColor={theme.colors.background.default}
          style={{ marginLeft: 'auto' }}
        />
      )}
    </Pressable>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: theme.colors.background.default,
    },
    header: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginBottom: 20,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: '#FFDA80',
      overflow: 'hidden',
      marginBottom: 16,
    },
    name: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },
    detailsContainer: {
      paddingHorizontal: 16,
      marginTop: 24,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface.default,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    detailRowBorder: {},
    detailIcon: {
      marginRight: 16,
    },
    detailText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.content.primary,
    },
    logoutText: {
      color: theme.colors.status.error.content,
    },
  });
