import React, { useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ChatMessage as ChatMessageType } from '@/src/types/chat';
import { ChatMessage } from './ChatMessage';
import { Theme } from '@/src/theme/types';

interface ChatListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  typingUsers?: { userId: string; name: string; timestamp: number }[];
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  isLoading,
  hasMore,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
  typingUsers = []
}) => {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);

  const renderItem = ({ item, index }: { item: ChatMessageType; index: number }) => {
    // Add detailed logging to debug the TypeError
    console.log('ChatList renderItem:', JSON.stringify({
      itemId: item?.message?.id,
      hasItem: !!item,
      hasMessage: !!item?.message,
      hasSender: !!item?.user,
      index
    }));
    
    // Determine if we should show the avatar based on the next message
    const showAvatar = index === messages.length - 1 || 
      messages[index + 1]?.user?.id !== item?.user?.id;
    
    return <ChatMessage message={item} showAvatar={showAvatar} />;
  };

  const renderFooter = () => {
    if (isLoading && hasMore) {
      return (
        <View style={styles(theme).loaderContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary.main} />
        </View>
      );
    }
    
    if (hasMore) {
      return (
        <View style={styles(theme).endOfMessagesContainer}>
          <Text style={styles(theme).endOfMessagesText}>
            Scroll to load more messages
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles(theme).endOfMessagesContainer}>
        <Text style={styles(theme).endOfMessagesText}>
          Beginning of conversation
        </Text>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.map(user => user.name);
    let typingText = '';
    
    if (names.length === 1) {
      typingText = `${names[0]} is typing...`;
    } else if (names.length === 2) {
      typingText = `${names[0]} and ${names[1]} are typing...`;
    } else {
      typingText = 'Several people are typing...';
    }
    
    return (
      <View style={styles(theme).typingContainer}>
        <Text style={styles(theme).typingText}>{typingText}</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  };

  return (
    <View style={styles(theme).container}>
      {messages.length === 0 && !isLoading ? (
        <View style={styles(theme).emptyContainer}>
          <Text style={styles(theme).emptyText}>
            No messages yet. Start the conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item?.message?.id || `fallback-${Math.random().toString(36).substr(2, 9)}`}
          inverted
          contentContainerStyle={styles(theme).listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary.main]}
                tintColor={theme.colors.primary.main}
              />
            ) : undefined
          }
        />
      )}
      
      {renderTypingIndicator()}
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    paddingVertical: theme.spacing.stack.md,
  },
  loaderContainer: {
    padding: theme.spacing.stack.md,
    alignItems: 'center',
  },
  endOfMessagesContainer: {
    padding: theme.spacing.stack.md,
    alignItems: 'center',
  },
  endOfMessagesText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.stack.lg,
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.content.secondary,
    textAlign: 'center',
  },
  typingContainer: {
    padding: theme.spacing.stack.xs,
    paddingHorizontal: theme.spacing.layout.section.padding,
  },
  typingText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.secondary,
    fontStyle: 'italic',
  },
}); 