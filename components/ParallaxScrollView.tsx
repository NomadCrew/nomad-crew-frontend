import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, useColorScheme, FlatList, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

// Dummy data for FlatList
const DUMMY_DATA = [{ key: 'content' }];

/**
 * Renders a scrollable content area with a parallax header image that responds to scroll.
 *
 * The header's background color is selected from `headerBackgroundColor` using the active color scheme and the header image scrolls and scales to produce a parallax effect. The scrollable content is provided via `children` and bottom padding accounts for any bottom tab overflow.
 *
 * @param children - Content to render below the header inside the scrollable area.
 * @param headerImage - The element displayed inside the header area.
 * @param headerBackgroundColor - Object with `light` and `dark` color strings used for the header background based on the current color scheme.
 * @returns A React element containing the parallax scroll view.
 */
export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.FlatList<{ key: string }>>();
  // @ts-expect-error - useScrollViewOffset works with FlatList but types don't match
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  const renderItem = () => <ThemedView style={styles.content}>{children}</ThemedView>;

  return (
    <ThemedView style={styles.container}>
      <Animated.FlatList
        ref={scrollRef}
        data={DUMMY_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: bottom }}
        ListHeaderComponent={() => (
          <Animated.View
            style={[
              styles.header,
              { backgroundColor: headerBackgroundColor[colorScheme] },
              headerAnimatedStyle,
            ]}
          >
            {headerImage}
          </Animated.View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});