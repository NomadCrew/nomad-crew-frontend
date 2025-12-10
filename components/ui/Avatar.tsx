import React, { useMemo } from 'react';
import {
  View,
  Image,
  Text,
  ViewProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'circle' | 'rounded' | 'square';

// Define a user interface that matches what we'll get from auth store
interface UserData {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  username?: string;
  email?: string;
  appleUser?: boolean;
}

export interface AvatarProps extends ViewProps {
  /**
   * The size of the avatar
   */
  size?: AvatarSize;

  /**
   * The shape of the avatar
   */
  variant?: AvatarVariant;

  /**
   * The source of the avatar image
   */
  source?: string;

  /**
   * The initials to display when no image is available
   */
  initials?: string;

  /**
   * The background color for the avatar when displaying initials
   */
  backgroundColor?: string;

  /**
   * Additional styles for the avatar container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional styles for the avatar image
   */
  imageStyle?: StyleProp<ImageStyle>;

  /**
   * Additional styles for the avatar text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * User data for generating avatar
   */
  user?: UserData;
}

/**
 * Render a user avatar that prefers an explicit image source and falls back to a user's profile picture, a generated avatar image, or initials.
 *
 * @param source - Explicit image URL to display; takes precedence over user data.
 * @param initials - Text to display when no image is available; used before deriving initials from `user`.
 * @param backgroundColor - Background color used when rendering initials.
 * @param user - Optional user data used to derive a profile image or initials. If `user.profilePicture` exists and `user.appleUser` is not true, that picture is used; otherwise a generated avatar URL is produced from the user's name, username, or email.
 * @returns The rendered avatar React element.
 */
export function Avatar({
  size = 'md',
  variant = 'circle',
  source,
  initials,
  backgroundColor,
  style,
  imageStyle,
  textStyle,
  user,
  ...rest
}: AvatarProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';

    // Size mappings
    const sizeMap = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
    };

    // Font size mappings based on avatar size
    const fontSizeMap = {
      xs: theme?.typography?.size?.xs || 12,
      sm: theme?.typography?.size?.sm || 14,
      md: theme?.typography?.size?.md || 16,
      lg: theme?.typography?.size?.lg || 18,
      xl: theme?.typography?.size?.xl || 20,
    };

    // Border radius mappings based on variant and size
    const getBorderRadius = () => {
      const dimension = sizeMap[size];

      switch (variant) {
        case 'circle':
          return dimension / 2;
        case 'rounded':
          return dimension / 4;
        case 'square':
          return 0;
        default:
          return dimension / 2;
      }
    };

    return {
      container: {
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: getBorderRadius(),
        backgroundColor: backgroundColor || primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      image: {
        width: '100%',
        height: '100%',
      },
      text: {
        color: '#FFFFFF',
        fontSize: fontSizeMap[size],
        fontWeight: '600',
        textAlign: 'center',
      },
    };
  });

  // If user data is provided, use it to determine the avatar
  const avatarSource = useMemo(() => {
    // First priority: direct source prop
    if (source) {
      return source;
    }

    // Second priority: user profile picture (except for Apple users)
    if (user?.profilePicture && !user?.appleUser) {
      return user.profilePicture;
    }

    // Third priority: generate avatar with UI Avatars
    // Always use for Apple users, or as fallback for any user without profile pic
    if (user) {
      // Generate name for UI Avatars
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const username = user.username || '';
      const email = user.email || '';

      // Get initials - either from name parts or username or email
      let displayName = '';
      if (firstName || lastName) {
        displayName = `${firstName} ${lastName}`.trim();
      } else if (username) {
        displayName = username;
      } else if (email) {
        // Use email before the @ symbol
        displayName = email.split('@')[0] ?? '';
      }

      if (displayName) {
        // Generate UI Avatars URL with better settings for our app
        // Using random background colors for visual variety
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=256&bold=true`;
      }
    }

    // No valid source found
    return null;
  }, [source, user]);

  // Calculate initials for fallback text display
  const displayInitials = useMemo(() => {
    // First priority: direct initials prop
    if (initials) {
      return initials;
    }

    // Second priority: derive from user data
    if (user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`;
      }
      if (user.firstName) {
        return user.firstName[0];
      }
      if (user.username) {
        return user.username[0];
      }
      if (user.email) {
        return user.email[0];
      }
    }

    return '';
  }, [initials, user]);

  return (
    <View style={[styles.container as ViewStyle, style]} {...rest}>
      {avatarSource ? (
        <Image
          source={{ uri: avatarSource }}
          style={[styles.image as ImageStyle, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.text as TextStyle, textStyle]}>
          {displayInitials?.substring(0, 2).toUpperCase() || ''}
        </Text>
      )}
    </View>
  );
}

export default React.memo(Avatar);
