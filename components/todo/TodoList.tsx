import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
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
import { Plus } from 'lucide-react-native';

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
  
  // Deduplicate the todos by unique id.
  const dedupedTodos = React.useMemo(() => {
    const todoMap = new Map<string, Todo>();
    todos.forEach(todo => {
      // Using the todo's id as key ensures only one instance is kept.
      todoMap.set(todo.id, todo);
    });
    return Array.from(todoMap.values());
  }, [todos]);

  // Handle pagination
  const handleLoadMore = React.useCallback(() => {
    if (!loading && hasMore) {
      fetchTodos(tripId, todos.length, 20);
    }
  }, [loading, hasMore, todos.length, tripId, fetchTodos]);

  const handleRetry = React.useCallback(() => {
    fetchTodos(tripId, 0, 20).catch(console.error);
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
          // Either use the onAnimationFinish callback or a timeout as fallback:
          setTimeout(() => setShowCompletionAnimation(false), 2000);
        }
      }}
      onDelete={() => deleteTodo(item.id)}
      disabled={loading}
      textColor={getColorForUUID(item.createdBy)}
    />
  ), [loading, updateTodo, deleteTodo]);

  if (loading && todos.length === 0) {
    return (
      <Surface style={styles(theme).centerContainer} pointerEvents="box-none">
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles(theme).centerContainer} pointerEvents="box-none">
        <Text style={styles(theme).errorText}>{error}</Text>
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
          <Text style={styles(theme).emptyText}>
            No todos yet. Create your first one!
          </Text>
        </Surface>
        
        {/* Add Todo FAB */}
        <Pressable 
          onPress={onAddTodoPress}
          style={({ pressed }) => [
            styles(theme).addTodoFab,
            { opacity: pressed ? 0.8 : 1 }
          ]}
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

      {/* Connection Status Banner */}
      {(connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') && (
        <Surface style={styles(theme).connectionBanner} pointerEvents="box-none">
          <Text style={styles(theme).connectionText}>
            {connectionStatus === 'CONNECTING' ? 'Connecting...' : 'Reconnecting...'}
          </Text>
        </Surface>
      )}

      {connectionStatus === 'ERROR' && (
        <Surface style={[styles(theme).loader, styles(theme).loader]} pointerEvents="box-none">
          <Text style={styles(theme).errorText}>
            Connection error. Please check your internet connection.
          </Text>
        </Surface>
      )}

      <FlashList
        data={dedupedTodos}
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
      
      {/* Add Todo FAB */}
      <Pressable 
        onPress={onAddTodoPress}
        style={({ pressed }) => [
          styles(theme).addTodoFab,
          { opacity: pressed ? 0.8 : 1 }
        ]}
      >
        <Plus size={28} color={theme.colors.primary.main} strokeWidth={2.5} />
      </Pressable>
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
    bottom: theme.spacing.inset.md,
    right: theme.spacing.inset.md,
    backgroundColor: theme.colors.surface.main,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
    zIndex: 5,
  },
  connectionBanner: {
    padding: theme.spacing.inset.sm,
    backgroundColor: theme.colors.content.secondary,
    marginBottom: theme.spacing.stack.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  connectionText: {
    ...theme.typography.body.small,
    color: theme.colors.content.primary,
    textAlign: 'center',
  },
});
