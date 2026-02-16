import React from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/src/theme/utils';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SubscribeBannerProps {
  onPress?: () => void;
}

const HEADER_HEIGHT = 260;
const MIN_BANNER_HEIGHT = 76;

export const SubscribeBanner: React.FC<SubscribeBannerProps> = ({ onPress }) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const gridMargin = theme.spacing.layout.screen.padding;
  const gridGap = theme.spacing.layout.section.gap;
  const bentoHeight = 180 * 2 + gridGap + gridMargin * 2;
  const bottomPadding = theme?.spacing?.stack?.xl ?? 40;

  const available =
    screenHeight - insets.top - HEADER_HEIGHT - bentoHeight - gridGap - bottomPadding;
  const bannerHeight = Math.max(MIN_BANNER_HEIGHT, Math.min(available, 120));

  const styles = useThemedStyles((theme) => {
    const primaryMain = theme?.colors?.primary?.main ?? '#F46315';
    const cardBg = theme?.colors?.background?.card ?? '#FFFFFF';
    const textPrimary = theme?.colors?.content?.primary ?? '#1A1A1A';
    const textTertiary = theme?.colors?.content?.tertiary ?? '#9CA3AF';
    const borderDefault = theme?.colors?.border?.default ?? '#E5E7EB';

    return {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderRadius: 24,
        backgroundColor: cardBg,
        paddingHorizontal: 20,
      },
      left: {
        flex: 1,
      },
      stat: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: textPrimary,
        letterSpacing: -0.3,
      },
      label: {
        fontSize: 12,
        color: textTertiary,
        marginTop: 2,
      },
      separator: {
        width: 1,
        height: '50%' as const,
        backgroundColor: borderDefault,
        marginHorizontal: 16,
      },
      cta: {
        backgroundColor: primaryMain,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
      },
      ctaText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: '#FFFFFF',
      },
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { height: bannerHeight },
        pressed && { opacity: 0.8 },
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel="One free trip included. Tap to see plans for your crew."
    >
      <View style={styles.left}>
        <Text style={styles.stat}>One trip included</Text>
        <Text style={styles.label}>Go further with your crew</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.cta}>
        <Text style={styles.ctaText}>See plans</Text>
      </View>
    </Pressable>
  );
};
