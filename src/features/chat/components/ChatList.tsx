import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ChatMessage } from './ChatMessage';
import { ChatMessageWithStatus } from '../types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';
import { useChatStore } from '../store';

interface ChatListProps {
  messages: ChatMessageWithStatus[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  typingUsers?: { userId: string; name: string; timestamp: number }[];
  tripId: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
  typingUsers = [],
  tripId
}) => {
  logger.debug('UI', `Rendering ChatList with ${messages.length} messages`);
  
  const { theme } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const { markAsRead, getLastReadMessageId } = useChatStore();
  
  // Get the last read message ID for this trip
  const lastReadMessageId = useMemo(() => getLastReadMessageId(tripId), [getLastReadMessageId, tripId]);
  
  // Sort messages by creation time (oldest first)
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.message.created_at || 0);
      const dateB = new Date(b.message.created_at || 0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [messages]);
  
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
  
  // Scroll to bottom when new messages arrive or component mounts
  useEffect(() => {
    if (sortedMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [sortedMessages.length]);
  
  // Scroll to bottom when the component mounts
  useEffect(() => {
    if (sortedMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }
  }, [sortedMessages.length]);
  
  // Mark the latest message as read when messages change
  useEffect(() => {
    if (sortedMessages.length > 0 && user?.id) {
      // Get the latest message
      const latestMessage = sortedMessages[sortedMessages.length - 1];
      
      // Check if the latest message is not from the current user and is newer than the last read message
      if (
        latestMessage.message.sender?.id !== user.id && 
        latestMessage.message.id !== lastReadMessageId
      ) {
        logger.debug('UI', `Marking message ${latestMessage.message.id} as read`);
        markAsRead(tripId, latestMessage.message.id);
      }
    }
  }, [sortedMessages, user?.id, tripId, markAsRead, lastReadMessageId]);
  
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
      },
      messageList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
      },
      loadingContainer: {
        padding: 12,
        alignItems: 'center',
      },
      typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: 'transparent',
      },
      typingText: {
        color: theme.colors.chat?.typing?.text || theme.colors.content.secondary,
        fontSize: 13,
        fontStyle: 'italic',
        opacity: 0.8,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      },
      emptyText: {
        color: theme.colors.content.secondary,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
        opacity: 0.8,
      },
      emptySubText: {
        color: theme.colors.content.tertiary,
        textAlign: 'center',
        fontSize: 13,
        marginTop: 8,
        opacity: 0.7,
      },
      dateSeparator: {
        alignItems: 'center',
        marginVertical: 16,
      },
      dateSeparatorLine: {
        height: 1,
        backgroundColor: theme.colors.border.default,
        opacity: 0.3,
        width: '100%',
        position: 'absolute',
      },
      dateSeparatorText: {
        backgroundColor: theme.colors.background.default,
        paddingHorizontal: 12,
        fontSize: 12,
        color: theme.colors.content.tertiary,
        fontWeight: '500',
      }
    });
  });

  const renderItem = useCallback(({ item, index }: { item: ChatMessageWithStatus; index: number }) => {
    // Validate message data
    if (!item.message || !item.message.sender) {
      logger.warn('UI', 'Invalid message data');
      return null;
    }
    
    // Determine if we should show the avatar
    // Show avatar if it's the last message or if the sender is different from the next message
    const showAvatar = index === 0 || 
      sortedMessages[index - 1].message.sender.id !== item.message.sender.id;
    
    return (
      <ChatMessage 
        messageWithStatus={item} 
        showAvatar={showAvatar} 
      />
    );
  }, [sortedMessages]);

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
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubText}>Start the conversation!</Text>
      </View>
    );
  }, [isLoading, styles]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={sortedMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.message.id}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        // Performance optimization: Only render items visible on screen
        windowSize={10}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        // Remove if not using custom date separators
        // ItemSeparatorComponent={({ leadingItem }) => <DateSeparator leadingItem={leadingItem} />} 
      />
      {renderTypingIndicator()}
    </View>
  );
};

// TODO: Re-evaluate the DateSeparator logic, possibly removing or simplifying it.
// interface DateSeparatorProps {
//   leadingItem: ChatMessageWithStatus;
// }

// const DateSeparator: React.FC<DateSeparatorProps> = ({ leadingItem }) => {
//   const { theme } = useTheme();
//   const styles = useThemedStyles((theme) => StyleSheet.create({
//     dateSeparator: {
//       alignItems: 'center',
//       marginVertical: 16,
//     },
//     dateSeparatorLine: {
//       height: 1,
//       backgroundColor: theme.colors.border.default,
//       opacity: 0.3,
//       width: '100%',
//       position: 'absolute',
//     },
//     dateSeparatorText: {
//       backgroundColor: theme.colors.background.default,
//       paddingHorizontal: 12,
//       fontSize: 12,
//       color: theme.colors.content.tertiary,
//       fontWeight: '500',
//     }
//   }));

//   const messageDate = new Date(leadingItem.message.created_at || 0);
  
//   // Only show date separator if it's a new day
//   // This logic needs access to the *previous* item, not `leadingItem` if it means the current.
//   // FlatList's ItemSeparatorComponent provides `leadingItem` (the item *before* the separator)
//   // and `trailingItem` (the item *after* the separator).
//   // This needs careful re-evaluation.

//   return (
//     <View style={styles.dateSeparator}>
//       <View style={styles.dateSeparatorLine} />
//       <Text style={styles.dateSeparatorText}>
//         {messageDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
//       </Text>
//     </View>
//   );
// }; 