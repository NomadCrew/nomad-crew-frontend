// components/trips/TripStats.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { CalendarClock } from 'lucide-react-native';
import { useThemedStyles } from '@/src/theme/utils';

export const TripStats: React.FC = () => {
  // Use our new useThemedStyles hook
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const textPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const textSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const surfaceVariant = theme?.colors?.surface?.variant || '#F3F4F6';
    const spacingInsetLg = theme?.spacing?.inset?.lg || 24;
    const spacingStackMd = theme?.spacing?.stack?.md || 16;
    const spacingStackSm = theme?.spacing?.stack?.sm || 12;
    const typographyHeadingH3 = theme?.typography?.heading?.h3 || { fontSize: 18, fontWeight: '600' };
    
    return {
      statsCard: {
        height: '100%',
        width: '100%',
        padding: spacingInsetLg,
        backgroundColor: surfaceVariant,
        borderRadius: 24,
        flex: 1,
      },
      statsTitle: {
        ...(typographyHeadingH3 || {}),
        color: textPrimary,
        marginBottom: spacingStackMd,
        fontWeight: '600',
      },
      statsContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center' as 'center',
      },
      comingSoonContainer: {
        alignItems: 'center' as 'center',
        justifyContent: 'center' as 'center',
      },
      icon: {
        marginBottom: spacingStackSm,
        opacity: 0.6,
      },
      comingSoon: {
        color: textSecondary,
        textAlign: 'center' as 'center',
        opacity: 0.8,
        letterSpacing: 0.25,
      },
    };
  });
  
  return (
    <Surface style={StyleSheet.flatten(styles.statsCard)} elevation={0}>
      <Text 
        variant="headlineSmall" 
        style={styles.statsTitle}
      >
        Trip Stats
      </Text>
      <View style={styles.statsContent}>
        <View style={styles.comingSoonContainer}>
          <CalendarClock size={32} color={styles.comingSoon.color} style={styles.icon} />
          <Text 
            variant="titleLarge" 
            style={styles.comingSoon}
          >
            Coming soon
          </Text>
        </View>
      </View>
    </Surface>
  );
};