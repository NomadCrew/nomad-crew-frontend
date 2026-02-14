import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';

interface VoteBarProps {
  /** Number of votes for this option */
  voteCount: number;
  /** Total votes across all options in the poll */
  totalVotes: number;
  /** Whether the current user voted for this option */
  isSelected: boolean;
  /** Whether the poll is closed */
  isClosed: boolean;
}

const BAR_HEIGHT = 36;
const BORDER_RADIUS = 10;

export const VoteBar: React.FC<VoteBarProps> = ({
  voteCount,
  totalVotes,
  isSelected,
  isClosed,
}) => {
  const { theme } = useAppTheme();
  const styles = makeStyles(theme);

  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
  const displayPercentage = Math.round(percentage);

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(percentage, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [percentage]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View
        style={[styles.track, isSelected && styles.trackSelected, isClosed && styles.trackClosed]}
      >
        <Animated.View
          style={[
            styles.fill,
            isSelected && styles.fillSelected,
            isClosed && !isSelected && styles.fillClosed,
            barStyle,
          ]}
        />
        <View style={styles.labelRow}>
          <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          </Text>
          {totalVotes > 0 && (
            <Text style={[styles.percentText, isSelected && styles.percentTextSelected]}>
              {displayPercentage}%
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    track: {
      height: BAR_HEIGHT,
      borderRadius: BORDER_RADIUS,
      backgroundColor: theme.colors.disabled.background,
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'center',
    },
    trackSelected: {
      backgroundColor: theme.colors.primary.surface,
    },
    trackClosed: {
      backgroundColor: theme.colors.disabled.background,
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: BORDER_RADIUS,
      backgroundColor: theme.colors.primary.border,
    },
    fillSelected: {
      backgroundColor: theme.colors.primary.main,
      opacity: 0.25,
    },
    fillClosed: {
      backgroundColor: theme.colors.content.tertiary,
      opacity: 0.15,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      zIndex: 1,
    },
    countText: {
      ...theme.typography.body.small,
      fontWeight: '500',
      color: theme.colors.content.secondary,
    },
    countTextSelected: {
      color: theme.colors.primary.main,
      fontWeight: '600',
    },
    percentText: {
      ...theme.typography.body.small,
      fontWeight: '700',
      color: theme.colors.content.tertiary,
    },
    percentTextSelected: {
      color: theme.colors.primary.main,
    },
  });
