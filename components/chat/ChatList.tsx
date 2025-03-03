import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ChatMessage } from './ChatMessage';
import { ChatMessageWithStatus } from '@/src/types/chat';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';

interface ChatListProps {
  messages: ChatMessageWithStatus[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  typingUsers?: { userId: string; name: string; timestamp: number }[];
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
  typingUsers = []
}) => {
  logger.debug('UI', `Rendering ChatList with ${messages.length} messages`);
  
  const { theme } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  // Filter out typing indicators older than 5 seconds and from the current user
  const activeTypingUsers = useMemo(() => {
    const now = Date.now();
    return typingUsers.filter(
      typingUser => now - typingUser.timestamp < 5000 && typingUser.userId !== user?.id
    );
  }, [typingUsers, user?.id]);
  
  // Log when the component mounts and when messages change
  useEffect(() => {
    logger.debug('UI', 'ChatList component mounted');
    
    return () => {
      logger.debug('UI', 'ChatList component unmounted');
    };
  }, []);
  
  // Log when messages change
  useEffect(() => {
    if (messages.length > 0) {
      logger.debug('UI', `Messages updated, now displaying ${messages.length} messages`);
    }
  }, [messages.length]);
  
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
      },
      messageList: {
        paddingHorizontal: theme.spacing.stack.md,
        paddingVertical: theme.spacing.stack.sm,
      },
      loadingContainer: {
        padding: theme.spacing.stack.md,
        alignItems: 'center',
      },
      typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.stack.md,
        paddingVertical: theme.spacing.stack.xs,
      },
      typingText: {
        color: theme.colors.content.secondary,
        fontSize: theme.typography.size.sm,
        fontStyle: 'italic',
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.stack.lg,
      },
      emptyText: {
        color: theme.colors.content.secondary,
        textAlign: 'center',
        fontSize: theme.typography.size.md,
      },
    });
  });

  const renderItem = useCallback(({ item, index }: { item: ChatMessageWithStatus; index: number }) => {
    // Validate message data
    if (!item.message || !item.message.sender) {
      logger.warn('UI', 'Invalid message data:', JSON.stringify(item, null, 2));
      return null;
    }
    
    // Determine if we should show the avatar
    // Show avatar if it's the first message or if the sender is different from the previous message
    const showAvatar = index === messages.length - 1 || 
      messages[index + 1].message.sender.id !== item.message.sender.id;
    
    return (
      <ChatMessage 
        messageWithStatus={item} 
        showAvatar={showAvatar} 
      />
    );
  }, [messages]);

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  }, [isLoading, styles, theme.colors.primary.main]);

  const renderTypingIndicator = useCallback(() => {
    if (activeTypingUsers.length === 0) {
      return null;
    }
    
    let typingText = '';
    if (activeTypingUsers.length === 1) {
      typingText = `${activeTypingUsers[0].name} is typing...`;
    } else if (activeTypingUsers.length === 2) {
      typingText = `${activeTypingUsers[0].name} and ${activeTypingUsers[1].name} are typing...`;
    } else {
      typingText = 'Several people are typing...';
    }
    
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  }, [activeTypingUsers, styles]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && onLoadMore) {
      logger.info('UI', 'End of list reached, loading more messages');
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      logger.info('UI', 'Manual refresh triggered by user');
      onRefresh();
    }
  }, [onRefresh]);

  // Render empty state if no messages
  const renderEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
      </View>
    );
  }, [isLoading, styles]);

  return (
    <View style={styles.container}>
      {renderTypingIndicator()}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.message.id}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        inverted
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
      />
    </View>
  );
}; 