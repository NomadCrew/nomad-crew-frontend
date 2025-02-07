import React, { useEffect, useState } from 'react';
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
import LottieView from 'lottie-react-native';

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
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const animationRef = React.useRef<LottieView>(null);
  const { 
    todos,
    loading,
    error,
    hasMore,
    fetchTodos,
    updateTodo,
    deleteTodo,
    wsConnection
  } = useTodoStore();

  const connectionStatus = wsConnection?.status;
  
  // Handle pagination
  const handleLoadMore = React.useCallback(() => {
    if (!loading && hasMore) {
      fetchTodos(tripId, todos.length, 20);
    }
  }, [loading, hasMore, todos.length, tripId, fetchTodos]);

  const handleRetry = React.useCallback(() => {
    fetchTodos(tripId, 0, 20)
      .catch(console.error);
  }, [tripId, fetchTodos]);

  // Initial data load
  useEffect(() => {
    fetchTodos(tripId, 0, 20);
  }, [tripId]);

  // Render items
  const renderItem = React.useCallback(({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onComplete={async () => {
        const newStatus = item.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
        const updatedTodo = await updateTodo(item.id, { status: newStatus });
        if (updatedTodo.status === 'COMPLETE') {
          setShowCompletionAnimation(true);
          // Use onAnimationFinish below to clear the state, or use a timeout as a fallback:
          setTimeout(() => setShowCompletionAnimation(false), 2000);
        }
      }}            
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
      {/* Add LottieView at the root level */}
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

      {/* Connection Status Banner */}
      {(connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') && (
        <Surface style={styles(theme).connectionBanner}>
          <Text style={styles(theme).connectionText}>
            {connectionStatus === 'CONNECTING' ? 'Connecting...' : 'Reconnecting...'}
          </Text>
        </Surface>
      )}

      {connectionStatus === 'ERROR' && (
        <Surface style={[styles(theme).loader, styles(theme).loader]}>
          <Text style={styles(theme).errorText}>
            Connection error. Please check your internet connection.
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
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.inset.lg,
    backgroundColor: theme.colors.surface.variant,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    // Optionally a semi-transparent background:
    // backgroundColor: 'rgba(0,0,0,0.2)',
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
