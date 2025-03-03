import React, { useRef, useEffect, useCallback } from 'react';
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
  logger.debug('Chat List', `Rendering ChatList with ${messages.length} messages`);
  
  const { theme } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  // Log when the component mounts and when messages change
  useEffect(() => {
    logger.debug('Chat List', 'ChatList component mounted');
    
    return () => {
      logger.debug('Chat List', 'ChatList component unmounted');
    };
  }, []);
  
  // Log when messages change
  useEffect(() => {
    if (messages.length > 0) {
      logger.debug('Chat List', `Messages updated, now displaying ${messages.length} messages`);
      
      // Log the most recent message for debugging
      const mostRecent = messages[0];
      if (mostRecent && mostRecent.message) {
        logger.debug(
          'Chat List', 
          `Most recent message: ID=${mostRecent.message.id}, ` +
          `Sender=${mostRecent.message.sender?.name || 'Unknown'}, ` +
          `Status=${mostRecent.status}`
        );
      }
    }
  }, [messages]);
  
  // Log loading state changes
  useEffect(() => {
    logger.debug('Chat List', `Loading state changed to: ${isLoading ? 'loading' : 'not loading'}`);
  }, [isLoading]);
  
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
      logger.warn('Chat List', 'Invalid message data:', JSON.stringify(item, null, 2));
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
    
    logger.debug('Chat List', 'Rendering loading indicator in footer');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  }, [isLoading, styles, theme.colors.primary.main]);

  const renderTypingIndicator = useCallback(() => {
    // Filter out typing indicators older than 5 seconds
    const now = Date.now();
    const recentTypingUsers = typingUsers.filter(
      user => now - user.timestamp < 5000 && user.userId !== user?.id
    );
    
    if (recentTypingUsers.length === 0) {
      return null;
    }
    
    let typingText = '';
    if (recentTypingUsers.length === 1) {
      typingText = `${recentTypingUsers[0].name} is typing...`;
    } else if (recentTypingUsers.length === 2) {
      typingText = `${recentTypingUsers[0].name} and ${recentTypingUsers[1].name} are typing...`;
    } else {
      typingText = 'Several people are typing...';
    }
    
    logger.debug('Chat List', `Showing typing indicator: ${typingText}`);
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  }, [typingUsers, styles, user?.id]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && onLoadMore) {
      logger.info('Chat List', 'End of list reached, loading more messages');
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      logger.info('Chat List', 'Manual refresh triggered by user');
      onRefresh();
    }
  }, [onRefresh]);

  if (messages.length === 0 && !isLoading) {
    logger.debug('Chat List', 'No messages to display, showing empty state');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No messages yet. Start the conversation!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.message.id}
        contentContainerStyle={styles.messageList}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderTypingIndicator}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}; 