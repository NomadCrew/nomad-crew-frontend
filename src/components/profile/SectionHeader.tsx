import React from 'react';
import { ViewStyle } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useThemedStyles } from '@/src/theme/utils';

export interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

/**
 * A reusable section header component for profile screen sections.
 * Displays an uppercase title with secondary text color.
 */
export function SectionHeader({ title, style }: SectionHeaderProps) {
  const styles = useThemedStyles((theme) => ({
    container: {
      marginTop: theme.spacing?.lg ?? 24,
      marginBottom: theme.spacing?.sm ?? 8,
      paddingHorizontal: theme.spacing?.md ?? 16,
    },
  }));

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText
        variant="body.small"
        color="content.secondary"
        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {title}
      </ThemedText>
    </ThemedView>
  );
}

export default React.memo(SectionHeader);
