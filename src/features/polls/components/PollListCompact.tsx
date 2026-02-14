import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import { usePolls } from '../hooks';
import type { PollResponse } from '../types';
import { formatCountdown } from '../utils';

interface PollListCompactProps {
  tripId: string;
  onPollPress: (poll: PollResponse) => void;
  onCreatePress?: () => void;
}

const ITEMS_PER_PAGE = 20;

export const PollListCompact: React.FC<PollListCompactProps> = ({
  tripId,
  onPollPress,
  onCreatePress,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error, refetch } = usePolls(tripId, offset, ITEMS_PER_PAGE);

  const polls = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? polls.length < pagination.total : false;

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [isLoading, hasMore]);

  const renderItem: ListRenderItem<PollResponse> = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => onPollPress(item)}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.question}, ${item.status === 'ACTIVE' ? 'active' : 'closed'}, ${item.totalVotes} votes`}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                item.status === 'ACTIVE'
                  ? theme.colors.status.success.main
                  : theme.colors.content.tertiary,
            },
          ]}
        />
        <View style={styles.textContainer}>
          <Text style={styles.question} numberOfLines={2}>
            {item.question}
          </Text>
          <Text style={styles.voteCount}>
            {item.totalVotes} {item.totalVotes === 1 ? 'vote' : 'votes'}
          </Text>
          {item.status === 'ACTIVE' && item.expiresAt && (
            <Text style={styles.expiryText}>{formatCountdown(item.expiresAt)}</Text>
          )}
        </View>
      </Pressable>
    ),
    [onPollPress, styles, theme]
  );

  // Loading state
  if (isLoading && polls.length === 0) {
    return (
      <View style={styles.container}>
        <Surface style={styles.centerContainer} pointerEvents="box-none">
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </Surface>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Surface style={styles.centerContainer} pointerEvents="box-none">
          <Text style={styles.emptyText}>Failed to load polls</Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </Surface>
        <CreateFab onPress={onCreatePress} theme={theme} />
      </View>
    );
  }

  // Empty state
  if (polls.length === 0) {
    return (
      <View style={styles.container}>
        <Surface style={styles.centerContainer} pointerEvents="box-none">
          <Text style={styles.emptyText}>No polls yet. Create your first one!</Text>
        </Surface>
        <CreateFab onPress={onCreatePress} theme={theme} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList<PollResponse>
        data={polls}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        estimatedItemSize={48}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.primary.main} />
          ) : null
        }
      />
      <CreateFab onPress={onCreatePress} theme={theme} />
    </View>
  );
};

// -- FAB sub-component --

const CreateFab: React.FC<{ onPress?: () => void; theme: Theme }> = ({ onPress, theme }) => {
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!onPress) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.8 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Create new poll"
    >
      <Plus size={28} color={theme.colors.primary.main} strokeWidth={2.5} />
    </Pressable>
  );
};

// -- Styles --

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.inset.lg,
      backgroundColor: theme.colors.surface.variant,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 72,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
      marginTop: 6,
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    question: {
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },
    voteCount: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
    },
    expiryText: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
      fontSize: 10,
    },
    loader: {
      padding: theme.spacing.inset.md,
    },
    emptyText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.md,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.surface.default,
      borderRadius: 28,
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
