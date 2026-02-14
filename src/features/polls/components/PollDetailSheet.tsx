import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Lock, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import { AppBottomSheet } from '@/src/components/molecules/AppBottomSheet/AppBottomSheet';
import { useTripAbility } from '@/src/features/auth/permissions';
import { useTripMembers } from '@/src/features/trips/hooks';
import { usePoll, useCastVote, useRemoveVote, useClosePoll, useDeletePoll } from '../hooks';
import type { PollResponse } from '../types';
import { formatCountdown } from '../utils';
import { PollOptionItem } from './PollOptionItem';

interface PollDetailSheetProps {
  tripId: string;
  poll: PollResponse | null;
  visible: boolean;
  onClose: () => void;
}

export const PollDetailSheet: React.FC<PollDetailSheetProps> = ({
  tripId,
  poll: initialPoll,
  visible,
  onClose,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { ability } = useTripAbility();

  // Use live data from React Query cache for optimistic update support.
  // Falls back to the initial prop when the query hasn't loaded yet.
  const { data: livePoll } = usePoll(tripId, initialPoll?.id ?? '');
  const poll = livePoll ?? initialPoll;

  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const closePoll = useClosePoll();
  const deletePoll = useDeletePoll();

  const isActive = poll?.status === 'ACTIVE';
  const isExpired = poll?.expiresAt ? new Date(poll.expiresAt) <= new Date() : false;

  const countdown = useMemo(() => {
    if (!poll?.expiresAt) return '';
    return formatCountdown(poll.expiresAt);
  }, [poll]);

  const { data: members } = useTripMembers(tripId);
  const memberCount = members?.length ?? 0;

  const uniqueVoterCount = useMemo(() => {
    if (!poll) return 0;
    const voters = new Set<string>();
    poll.options.forEach((opt) => opt.voters.forEach((v) => voters.add(v.userId)));
    return voters.size;
  }, [poll]);

  const allMembersVoted = memberCount > 0 && uniqueVoterCount >= memberCount;

  const canClose = poll
    ? ability.can('update', {
        __typename: 'Poll' as const,
        id: poll.id,
        tripId: poll.tripId,
        createdBy: poll.createdBy,
      })
    : false;

  const canDelete = poll
    ? ability.can('delete', {
        __typename: 'Poll' as const,
        id: poll.id,
        tripId: poll.tripId,
        createdBy: poll.createdBy,
      })
    : false;

  const canCloseNow = canClose && (isExpired || allMembersVoted);

  const handleVote = useCallback(
    (optionId: string) => {
      if (!poll) return;
      castVote.mutate({ tripId, pollId: poll.id, optionId });
    },
    [tripId, poll, castVote]
  );

  const handleRemoveVote = useCallback(
    (optionId: string) => {
      if (!poll) return;
      removeVote.mutate({ tripId, pollId: poll.id, optionId });
    },
    [tripId, poll, removeVote]
  );

  const handleClose = useCallback(() => {
    if (!poll) return;
    closePoll.mutate({ tripId, pollId: poll.id });
  }, [tripId, poll, closePoll]);

  const handleDelete = useCallback(() => {
    if (!poll) return;
    deletePoll.mutate({ tripId, pollId: poll.id }, { onSuccess: () => onClose() });
  }, [tripId, poll, deletePoll, onClose]);

  const sortedOptions = useMemo(() => {
    if (!poll) return [];
    return [...poll.options].sort((a, b) => a.position - b.position);
  }, [poll]);

  const timeAgo = useMemo(() => {
    if (!poll) return '';
    return formatTimeAgo(poll.createdAt);
  }, [poll]);

  const metaText = useMemo(() => {
    if (!poll) return '';
    let text = timeAgo;
    if (poll.totalVotes > 0) text += ` \u00B7 ${formatVoteSummary(poll.totalVotes)}`;
    if (isActive && countdown) {
      text += ` \u00B7 ${countdown}`;
    }
    return text;
  }, [poll, timeAgo, isActive, countdown]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose} snapPoints={['60%', '90%']} scrollable>
      {poll && (
        <View style={styles.container}>
          {/* Header: status badge + actions */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <StatusBadge status={poll.status} theme={theme} />
              {poll.allowMultipleVotes && (
                <View style={styles.multiVoteBadge}>
                  <Text style={styles.multiVoteText}>Multi-vote</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {isActive && canCloseNow && (
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close poll"
                >
                  <Lock size={18} color={theme.colors.content.tertiary} />
                </Pressable>
              )}
              {canDelete && (
                <Pressable
                  onPress={handleDelete}
                  hitSlop={8}
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel="Delete poll"
                >
                  <Trash2 size={18} color={theme.colors.content.tertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Question */}
          <Text style={styles.question}>{poll.question}</Text>

          {/* Meta line */}
          <Text style={styles.meta}>{metaText}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {sortedOptions.map((option) => (
              <PollOptionItem
                key={option.id}
                option={option}
                totalVotes={poll.totalVotes}
                isActive={isActive ?? false}
                onVote={handleVote}
                onRemoveVote={handleRemoveVote}
              />
            ))}
          </View>

          {/* Footer prompt */}
          {isActive && allMembersVoted && (
            <Text style={styles.allVotedText}>All nomads have voted</Text>
          )}
          {isActive && !allMembersVoted && poll.userVoteCount === 0 && (
            <Text style={styles.promptText}>Drop your vote, nomad</Text>
          )}
          {!isActive && <Text style={styles.closedText}>The tribe has spoken</Text>}
        </View>
      )}
    </AppBottomSheet>
  );
};

// -- Status Badge sub-component (same pattern as PollCard) --

interface StatusBadgeProps {
  status: 'ACTIVE' | 'CLOSED';
  theme: Theme;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, theme }) => {
  const styles = useMemo(() => makeBadgeStyles(theme), [theme]);

  if (status === 'ACTIVE') {
    return <LiveBadge theme={theme} />;
  }

  return (
    <View style={styles.closedBadge}>
      <Text style={styles.closedBadgeText}>CLOSED</Text>
    </View>
  );
};

const LiveBadge: React.FC<{ theme: Theme }> = ({ theme }) => {
  const styles = useMemo(() => makeBadgeStyles(theme), [theme]);
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
};

// -- Helpers --

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return 'Just now';
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function formatVoteSummary(total: number): string {
  if (total === 1) return '1 vote cast';
  return `${total} votes cast`;
}

// -- Styles --

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
    },
    question: {
      ...theme.typography.heading.h3,
      color: theme.colors.content.primary,
      marginBottom: 4,
    },
    meta: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
      marginBottom: 16,
    },
    optionsContainer: {
      gap: 2,
    },
    promptText: {
      ...theme.typography.body.small,
      fontWeight: '600',
      color: theme.colors.primary.main,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    closedText: {
      ...theme.typography.body.small,
      fontWeight: '500',
      color: theme.colors.content.tertiary,
      textAlign: 'center',
      marginTop: 12,
    },
    allVotedText: {
      ...theme.typography.body.small,
      fontWeight: '600',
      color: theme.colors.status.success.main,
      textAlign: 'center',
      marginTop: 8,
    },
    multiVoteBadge: {
      backgroundColor: theme.colors.status.info.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    multiVoteText: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.status.info.content,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

const makeBadgeStyles = (theme: Theme) =>
  StyleSheet.create({
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.status.success.surface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.colors.status.success.main,
    },
    liveBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.status.success.main,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    closedBadge: {
      backgroundColor: theme.colors.disabled.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    closedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.content.tertiary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });
