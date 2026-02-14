import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import { useTripAbility } from '@/src/features/auth/permissions';
import { usePolls, useCastVote, useRemoveVote, useClosePoll, useDeletePoll } from '../hooks';
import type { PollResponse } from '../types';
import { PollCard } from './PollCard';

interface PollListProps {
  tripId: string;
  onCreatePress?: () => void;
}

const ITEMS_PER_PAGE = 20;

export const PollList: React.FC<PollListProps> = ({ tripId, onCreatePress }) => {
  const { theme } = useAppTheme();
  const styles = makeStyles(theme);
  const [offset, setOffset] = useState(0);

  const { ability } = useTripAbility();

  const { data, isLoading, error, refetch } = usePolls(tripId, offset, ITEMS_PER_PAGE);
  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const closePoll = useClosePoll();
  const deletePoll = useDeletePoll();

  const polls = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? polls.length < pagination.total : false;

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [isLoading, hasMore]);

  const handleVote = useCallback(
    (pollId: string, optionId: string) => {
      castVote.mutate({ tripId, pollId, optionId });
    },
    [tripId, castVote]
  );

  const handleRemoveVote = useCallback(
    (pollId: string, optionId: string) => {
      removeVote.mutate({ tripId, pollId, optionId });
    },
    [tripId, removeVote]
  );

  const handleClose = useCallback(
    (pollId: string) => {
      closePoll.mutate({ tripId, pollId });
    },
    [tripId, closePoll]
  );

  const handleDelete = useCallback(
    (pollId: string) => {
      deletePoll.mutate({ tripId, pollId });
    },
    [tripId, deletePoll]
  );

  const renderItem: ListRenderItem<PollResponse> = useCallback(
    ({ item }) => {
      // Check permissions for this specific poll
      const canClose = ability.can('update', {
        __typename: 'Poll' as const,
        id: item.id,
        tripId: item.tripId,
        createdBy: item.createdBy,
      });

      const canDelete = ability.can('delete', {
        __typename: 'Poll' as const,
        id: item.id,
        tripId: item.tripId,
        createdBy: item.createdBy,
      });

      return (
        <PollCard
          poll={item}
          onVote={handleVote}
          onRemoveVote={handleRemoveVote}
          onClose={canClose && item.status === 'ACTIVE' ? handleClose : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      );
    },
    [ability, handleVote, handleRemoveVote, handleClose, handleDelete]
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
          <Text style={styles.errorText}>Oops, your polls got lost in transit. Try again?</Text>
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
          <Text style={styles.emptyTitle}>No polls yet</Text>
          <Text style={styles.emptyText}>
            Democracy hasn't reached this trip yet.{'\n'}Be the first to stir the pot!
          </Text>
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
        estimatedItemSize={250}
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
  if (!onPress) return null;

  const styles = makeStyles(theme);

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
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 80,
    },
    loader: {
      padding: theme.spacing.inset.md,
    },
    errorText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      marginBottom: theme.spacing.stack.md,
      textAlign: 'center',
    },
    emptyTitle: {
      ...theme.typography.heading.h3,
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.stack.xs,
      textAlign: 'center',
    },
    emptyText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.md,
      lineHeight: 22,
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
      elevation: 4,
      shadowColor: theme.colors.content.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
  });
