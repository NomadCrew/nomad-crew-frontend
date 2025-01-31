import React, { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useTodoStore } from '@/src/store/useTodoStore';
import { TodoItem } from './TodoItem';
import { TodoErrorBoundary } from './TodoErrorBoundary';
import { Todo } from '@/src/types/todo';
import { getColorForUUID } from '@/src/utils/uuidToColor';

interface TodoListProps {
  tripId: string;
  onAddTodoPress?: () => void;
}

const ITEMS_PER_PAGE = 5;

export const TodoList = ({ tripId, onAddTodoPress }: TodoListProps) => {
  return (
    <TodoErrorBoundary>
      <TodoListContent tripId={tripId} onAddTodoPress={onAddTodoPress} />
    </TodoErrorBoundary>
  );
};

const TodoListContent = ({ tripId, onAddTodoPress }: TodoListProps) => {
  const { theme } = useTheme();
  const { 
    todos,
    loading,
    error,
    hasMore,
    connectionState,
    fetchTodos,
    updateTodo,
    deleteTodo,
    subscribeToTodoEvents,
    unsubscribeFromTodoEvents
  } = useTodoStore();

  const prevConnectionStateRef = useRef(connectionState);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    const handleStateChange = () => {
      if (!isMountedRef.current) return;
      if (prevConnectionStateRef.current !== connectionState) {
        console.debug('[SSE] Connection state changed:', {
          from: prevConnectionStateRef.current,
          to: connectionState
        });
        prevConnectionStateRef.current = connectionState;
      }
    };

    const unsubscribe = useTodoStore.subscribe(handleStateChange, (state) => state.connectionState);
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [connectionState]);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        await fetchTodos(tripId, 0, ITEMS_PER_PAGE);
        subscribeToTodoEvents(tripId);
      } catch (error) {
        console.error('Failed to load todos:', error);
      }
    };

    loadTodos();
    return () => unsubscribeFromTodoEvents();
  }, [tripId, fetchTodos, subscribeToTodoEvents, unsubscribeFromTodoEvents]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTodos(tripId, todos.length, ITEMS_PER_PAGE);
    }
  }, [loading, hasMore, todos.length, tripId, fetchTodos]);

  const handleRetry = useCallback(() => {
    unsubscribeFromTodoEvents();
    fetchTodos(tripId, 0, ITEMS_PER_PAGE)
      .then(() => subscribeToTodoEvents(tripId))
      .catch(console.error);
  }, [tripId, fetchTodos, subscribeToTodoEvents, unsubscribeFromTodoEvents]);

  const renderItem = useCallback(({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onComplete={() => updateTodo(item.id, {
        status: item.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'
      })}
      onDelete={() => deleteTodo(item.id)}
      disabled={loading}
      textColor={getColorForUUID(item.id)}
    />
  ), [loading, updateTodo, deleteTodo]);

  if (loading && todos.length === 0) {
    return (
      <Surface style={styles(theme).centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles(theme).centerContainer}>
        <Text style={styles(theme).errorText}>{error}</Text>
        <Button mode="contained" onPress={handleRetry}>
          Retry
        </Button>
      </Surface>
    );
  }

  if (todos.length === 0) {
    return (
      <Surface style={styles(theme).centerContainer}>
        <Text style={styles(theme).emptyText}>
          No todos yet. Create your first one!
        </Text>
        <Button 
          mode="contained" 
          onPress={onAddTodoPress}
          style={{ marginTop: 16 }}
        >
          Add Todo
        </Button>
      </Surface>
    );
  }

  return (
    <View style={styles(theme).container}>
      {(connectionState === 'CONNECTING' || connectionState === 'RECONNECTING' || connectionState === 'CLOSED') && (
        <Surface style={styles(theme).reconnectingBanner}>
          <Text style={styles(theme).reconnectingText}>
            {connectionState === 'RECONNECTING' ? 'Reconnecting...' : 'Connecting...'}
          </Text>
        </Surface>
      )}
      <FlashList
        data={todos}
        renderItem={renderItem}
        estimatedItemSize={60}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator 
              style={styles(theme).loader}
              color={theme.colors.primary.main}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.inset.lg,
    backgroundColor: theme.colors.surface.variant,
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
  emptyText: {
    ...theme.typography.body.medium,
    color: theme.colors.content.secondary,
    textAlign: 'center',
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
});
