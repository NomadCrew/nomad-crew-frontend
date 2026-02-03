import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useThemedStyles } from '@/src/theme/utils';

export interface SettingsRowProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Primary label text */
  label: string;
  /** Optional secondary value text displayed below label */
  value?: string;
  /** Handler for row press */
  onPress?: () => void;
  /** Custom element to render on the right side (replaces chevron) */
  rightElement?: ReactNode;
  /** Whether to show chevron when onPress is provided (default: true) */
  showChevron?: boolean;
}

/**
 * A reusable settings row component with icon, label, optional value, and navigation chevron.
 * Can include a custom right element (e.g., Switch) instead of the default chevron.
 */
export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  showChevron = true,
}: SettingsRowProps) {
  const styles = useThemedStyles((theme) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: 56,
      paddingHorizontal: theme.spacing?.md ?? 16,
      paddingVertical: theme.spacing?.sm ?? 8,
      backgroundColor: theme.colors?.background?.card ?? '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors?.border?.default ?? '#E5E7EB',
    },
    iconContainer: {
      width: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: theme.spacing?.sm ?? 8,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center' as const,
    },
    rightContainer: {
      marginLeft: theme.spacing?.sm ?? 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconColor: theme.colors?.content?.secondary ?? '#6B7280',
    chevronColor: theme.colors?.content?.tertiary ?? '#9CA3AF',
  }));

  const content = (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color={styles.iconColor} />
      </View>
      <View style={styles.contentContainer}>
        <ThemedText variant="body.medium">{label}</ThemedText>
        {value && (
          <ThemedText variant="body.small" color="content.tertiary">
            {value}
          </ThemedText>
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightElement ? (
          rightElement
        ) : showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={20} color={styles.chevronColor} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default React.memo(SettingsRow);
