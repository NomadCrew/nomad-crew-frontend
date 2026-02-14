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
import { X, Lock, MoreVertical } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import type { PollResponse } from '../types';
import { PollOptionItem } from './PollOptionItem';

interface PollCardProps {
  poll: PollResponse;
  onVote: (pollId: string, optionId: string) => void;
  onRemoveVote: (pollId: string, optionId: string) => void;
  onClose?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  onRemoveVote,
  onClose,
  onDelete,
}) => {
  const { theme } = useAppTheme();
  const styles = makeStyles(theme);

  const isActive = poll.status === 'ACTIVE';

  const handleVote = useCallback(
    (optionId: string) => onVote(poll.id, optionId),
    [poll.id, onVote]
  );

  const handleRemoveVote = useCallback(
    (optionId: string) => onRemoveVote(poll.id, optionId),
    [poll.id, onRemoveVote]
  );

  const sortedOptions = useMemo(() => {
    return [...poll.options].sort((a, b) => a.position - b.position);
  }, [poll.options]);

  const timeAgo = useMemo(() => formatTimeAgo(poll.createdAt), [poll.createdAt]);

  return (
    <View style={styles.card}>
      {/* Header */}
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
          {isActive && onClose && (
            <Pressable
              onPress={() => onClose(poll.id)}
              hitSlop={8}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Close poll"
            >
              <Lock size={16} color={theme.colors.content.tertiary} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={() => onDelete(poll.id)}
              hitSlop={8}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Delete poll"
            >
              <X size={16} color={theme.colors.content.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Meta line */}
      <Text style={styles.meta}>
        {timeAgo}
        {poll.totalVotes > 0 && ` \u00B7 ${formatVoteSummary(poll.totalVotes)}`}
      </Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {sortedOptions.map((option) => (
          <PollOptionItem
            key={option.id}
            option={option}
            totalVotes={poll.totalVotes}
            isActive={isActive}
            onVote={handleVote}
            onRemoveVote={handleRemoveVote}
          />
        ))}
      </View>

      {/* Footer prompt */}
      {isActive && poll.userVoteCount === 0 && (
        <Text style={styles.promptText}>Drop your vote, nomad</Text>
      )}
      {!isActive && <Text style={styles.closedText}>The tribe has spoken</Text>}
    </View>
  );
};

// -- Status Badge sub-component --

interface StatusBadgeProps {
  status: 'ACTIVE' | 'CLOSED';
  theme: Theme;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, theme }) => {
  const styles = makeBadgeStyles(theme);

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
  const styles = makeBadgeStyles(theme);
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
  }, []);

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
    card: {
      backgroundColor: theme.colors.surface.default,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
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
      padding: 6,
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
      marginBottom: 12,
    },
    optionsContainer: {
      gap: 2,
    },
    promptText: {
      ...theme.typography.body.small,
      fontWeight: '600',
      color: theme.colors.primary.main,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    closedText: {
      ...theme.typography.body.small,
      fontWeight: '500',
      color: theme.colors.content.tertiary,
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
