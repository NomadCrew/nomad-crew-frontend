import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
  const styles = makeStyles(theme);

  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!isActive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (option.hasVoted) {
      onRemoveVote(option.id);
    } else {
      onVote(option.id);
    }
  }, [isActive, option.hasVoted, option.id, onVote, onRemoveVote]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 20, stiffness: 300 }) }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        if (isActive) scale.value = 0.97;
      }}
      onPressOut={() => {
        scale.value = 1;
      }}
      onPress={handlePress}
      disabled={!isActive}
      style={[styles.container, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={
        option.hasVoted ? `Remove vote from ${option.text}` : `Vote for ${option.text}`
      }
    >
      <View style={styles.header}>
        <View style={styles.optionTextRow}>
          {option.hasVoted && (
            <View style={styles.checkBadge}>
              <Check size={12} color={theme.colors.primary.onPrimary} strokeWidth={3} />
            </View>
          )}
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
