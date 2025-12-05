import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useTodos, useUpdateTodo, useDeleteTodo } from '../hooks';
import { TodoItem } from './TodoItem';
import { TodoErrorBoundary } from './TodoErrorBoundary';
import { Todo } from '../types';
import { getColorForUUID } from '@/src/utils/uuidToColor';
import LottieView from 'lottie-react-native';
import { Plus } from 'lucide-react-native';

interface TodoListProps {
  tripId: string;
  onAddTodoPress?: () => void;
}

const ITEMS_PER_PAGE = 20;

export const TodoList = ({ tripId, onAddTodoPress }: TodoListProps) => {
  return (
    <TodoErrorBoundary>
      <TodoListContent tripId={tripId} onAddTodoPress={onAddTodoPress} />
    </TodoErrorBoundary>
  );
};

const TodoListContent = ({ tripId, onAddTodoPress }: TodoListProps) => {
  const { theme } = useAppTheme();
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [offset, setOffset] = useState(0);

  // TanStack Query hooks
  const { data, isLoading, error, refetch } = useTodos(tripId, offset, ITEMS_PER_PAGE);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const todos = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? todos.length < pagination.total : false;

  // Deduplicate the todos by unique id
  const dedupedTodos = React.useMemo(() => {
    const todoMap = new Map<string, Todo>();
    todos.forEach((todo) => {
      todoMap.set(todo.id, todo);
    });
    return Array.from(todoMap.values());
  }, [todos]);

  // Handle pagination
  const handleLoadMore = React.useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [isLoading, hasMore]);

  const handleRetry = React.useCallback(() => {
    setOffset(0);
    refetch();
  }, [refetch]);

  // Render items
  const renderItem = React.useCallback(
    ({ item }: { item: Todo }) => (
      <TodoItem
        todo={item}
        onComplete={async () => {
          const newStatus = item.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
          updateTodo.mutate(
            { tripId, id: item.id, input: { status: newStatus } },
            {
              onSuccess: (updatedTodo) => {
                if (updatedTodo.status === 'COMPLETE') {
                  setShowCompletionAnimation(true);
                  setTimeout(() => setShowCompletionAnimation(false), 2000);
                }
              },
            }
          );
        }}
        onDelete={() => {
          deleteTodo.mutate({ tripId, id: item.id });
        }}
        disabled={isLoading}
        textColor={getColorForUUID(item.createdBy)}
      />
    ),
    [isLoading, updateTodo, deleteTodo, tripId]
  );

  if (isLoading && todos.length === 0) {
    return (
      <Surface style={styles(theme).centerContainer} pointerEvents="box-none">
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles(theme).centerContainer} pointerEvents="box-none">
        <Text style={styles(theme).errorText}>
          {error instanceof Error ? error.message : 'Failed to load todos'}
        </Text>
        <Button mode="contained" onPress={handleRetry}>
          Retry
        </Button>
      </Surface>
    );
  }

  if (todos.length === 0) {
    return (
      <View style={styles(theme).container}>
        <Surface style={styles(theme).centerContainer} pointerEvents="box-none">
          <Text style={styles(theme).emptyText}>No to dos yet. Create your first one!</Text>
        </Surface>

        {/* Add Todo FAB */}
        <Pressable
          onPress={onAddTodoPress}
          style={({ pressed }) => [styles(theme).addTodoFab, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Plus size={28} color={theme.colors.primary.main} strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      {/* Completion animation overlay */}
      {showCompletionAnimation && (
        <View style={styles(theme).overlay}>
          <LottieView
            source={require('@/assets/animations/confetti.json')}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowCompletionAnimation(false)}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      <FlashList
        data={dedupedTodos}
        renderItem={renderItem}
        estimatedItemSize={60}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator style={styles(theme).loader} color={theme.colors.primary.main} />
          ) : null
        }
      />

      {/* Add Todo FAB */}
      <Pressable
        onPress={onAddTodoPress}
        style={({ pressed }) => [styles(theme).addTodoFab, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Plus size={28} color={theme.colors.primary.main} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
};

const styles = (theme: Theme) =>
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
      borderColor: 'rgba(0, 0, 0, 0.08)',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
    },
    loader: {
      padding: theme.spacing.inset.md,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    errorText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      marginBottom: theme.spacing.stack.md,
      textAlign: 'center',
    },
    emptyText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.stack.md,
    },
    addButton: {
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 24,
      elevation: 2,
      minWidth: 120,
    },
    buttonLabel: {
      ...theme.typography.button.medium,
      fontSize: 14,
      letterSpacing: 0.5,
    },
    reconnectingBanner: {
      padding: theme.spacing.inset.sm,
      backgroundColor: theme.colors.content.secondary,
      marginBottom: theme.spacing.stack.sm,
    },
    reconnectingText: {
      ...theme.typography.body.small,
      color: theme.colors.content.primary,
      textAlign: 'center',
    },
    addTodoFab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.surface.default,
      borderRadius: 28,
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4, // For Android shadow
      shadowColor: '#000', // For iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
  });
