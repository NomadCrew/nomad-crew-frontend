import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import type { PollOptionWithVotes } from '../types';
import { VoteBar } from './VoteBar';

interface PollOptionItemProps {
  option: PollOptionWithVotes;
  totalVotes: number;
  isActive: boolean;
  onVote: (optionId: string) => void;
  onRemoveVote: (optionId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PollOptionItem: React.FC<PollOptionItemProps> = ({
  option,
  totalVotes,
  isActive,
  onVote,
  onRemoveVote,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(option.hasVoted ? 1 : 0);
  const voted = useSharedValue(option.hasVoted ? 1 : 0);

  useEffect(() => {
    if (option.hasVoted) {
      // Bounce in: overshoot then settle
      checkScale.value = withSpring(1, { damping: 10, stiffness: 300, mass: 0.6 });
      voted.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
    } else {
      checkScale.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
      voted.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
    }
  }, [option.hasVoted, checkScale, voted]);

  const handlePress = useCallback(() => {
    if (!isActive) return;

    // Bounce animation on the whole card
    scale.value = withSequence(
      withTiming(0.95, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );

    if (option.hasVoted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRemoveVote(option.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onVote(option.id);
    }
  }, [isActive, option.hasVoted, option.id, onVote, onRemoveVote, scale]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      voted.value,
      [0, 1],
      [theme.colors.border.default, theme.colors.primary.main]
    ),
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={!isActive}
      style={[styles.container, containerAnimatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={
        option.hasVoted ? `Remove vote from ${option.text}` : `Vote for ${option.text}`
      }
    >
      <View style={styles.header}>
        <View style={styles.optionTextRow}>
          <Animated.View style={[styles.checkBadge, checkAnimatedStyle]}>
            <Check size={12} color={theme.colors.primary.onPrimary} strokeWidth={3} />
          </Animated.View>
          <Text
            style={[styles.optionText, option.hasVoted && styles.optionTextSelected]}
            numberOfLines={2}
          >
            {option.text}
          </Text>
        </View>
      </View>

      <VoteBar
        voteCount={option.voteCount}
        totalVotes={totalVotes}
        isSelected={option.hasVoted}
        isClosed={!isActive}
      />

      {option.voters.length > 0 && (
        <View style={styles.voterRow}>
          <Text style={styles.voterText}>{formatVoterText(option.voters.length)}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

function formatVoterText(count: number): string {
  if (count === 1) return '1 nomad voted';
  return `${count} nomads voted`;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 8,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    optionTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    checkBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionText: {
      ...theme.typography.body.medium,
      fontWeight: '500',
      color: theme.colors.content.primary,
      flex: 1,
    },
    optionTextSelected: {
      fontWeight: '700',
      color: theme.colors.primary.main,
    },
    voterRow: {
      marginTop: 4,
      paddingLeft: 2,
    },
    voterText: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
    },
  });
