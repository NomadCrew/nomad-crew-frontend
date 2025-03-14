import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/src/theme/utils';

export type TagVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type TagSize = 'sm' | 'md';

export interface TagProps {
  /**
   * The label text of the tag
   */
  label: string;
  
  /**
   * The variant of the tag
   */
  variant?: TagVariant;
  
  /**
   * The size of the tag
   */
  size?: TagSize;
  
  /**
   * Icon to display at the start of the tag
   */
  startIcon?: React.ReactNode;
  
  /**
   * Additional styles for the tag container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the tag text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Tag component for displaying status or categorization
 */
export function Tag({
  label,
  variant = 'default',
  size = 'md',
  startIcon,
  style,
  textStyle,
}: TagProps) {
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const colors = {
      default: {
        background: theme?.colors?.surface?.variant || '#F3F4F6',
        text: theme?.colors?.content?.secondary || '#6B7280',
      },
      success: {
        background: theme?.colors?.success?.surface || '#ECFDF5',
        text: theme?.colors?.success?.main || '#10B981',
      },
      warning: {
        background: theme?.colors?.warning?.surface || '#FFFBEB',
        text: theme?.colors?.warning?.main || '#F59E0B',
      },
      error: {
        background: theme?.colors?.error?.surface || '#FEF2F2',
        text: theme?.colors?.error?.main || '#EF4444',
      },
      info: {
        background: theme?.colors?.info?.surface || '#EFF6FF',
        text: theme?.colors?.info?.main || '#3B82F6',
      },
    };
    
    // Size mappings
    const sizeMap = {
      sm: {
        height: 20,
        paddingHorizontal: 6,
        fontSize: theme?.typography?.size?.xs || 12,
        iconSize: 12,
      },
      md: {
        height: 24,
        paddingHorizontal: 8,
        fontSize: theme?.typography?.size?.sm || 14,
        iconSize: 14,
      },
    };
    
    return {
      tag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizeMap[size].height,
        paddingHorizontal: sizeMap[size].paddingHorizontal,
        borderRadius: theme?.borderRadius?.sm || 4,
        backgroundColor: colors[variant].background,
      },
      label: {
        fontSize: sizeMap[size].fontSize,
        color: colors[variant].text,
        fontWeight: '500',
      },
      startIcon: {
        marginRight: 4,
      },
    };
  });
  
  return (
    <View style={[styles.tag, style]}>
      {startIcon && <View style={styles.startIcon}>{startIcon}</View>}
      <Text style={[styles.label, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default React.memo(Tag); 