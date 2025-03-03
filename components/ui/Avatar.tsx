import React from 'react';
import { View, Image, Text, StyleSheet, ViewProps, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'circle' | 'rounded' | 'square';

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
}

/**
 * Avatar component for displaying user profile images or initials
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
  
  return (
    <View style={[styles.container, style]} {...rest}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {initials?.substring(0, 2).toUpperCase() || ''}
        </Text>
      )}
    </View>
  );
}

export default React.memo(Avatar);