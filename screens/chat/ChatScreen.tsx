import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, Text } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatGroupList } from '@/components/chat/ChatGroupList';
import { ChatAuthError } from '@/components/chat/ChatAuthError';
import { chatWsManager } from '@/src/websocket/ChatWebSocketManager';
import { Theme } from '@/src/theme/types';
import { StatusBar } from 'expo-status-bar';

interface ChatScreenProps {
  tripId: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId }) => {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Auth store state
  const { token, isInitialized } = useAuthStore();
  
  // Chat store state and actions
  const {
    groups,
    selectedGroupId,
    isLoadingGroups,
    messagesByGroupId,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchChatGroups,
    selectChatGroup,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markAsRead,
    handleChatEvent,
    setTypingStatus
  } = useChatStore();
  
  // Filter groups by tripId
  const tripGroups = groups.filter(group => group.tripId === tripId);
  
  // Get messages for the selected group
  const messages = selectedGroupId ? messagesByGroupId[selectedGroupId] || [] : [];
  const hasMore = selectedGroupId ? hasMoreMessages[selectedGroupId] || false : false;
  const currentTypingUsers = selectedGroupId ? typingUsers[selectedGroupId] || [] : [];
  
  // Check for authentication before fetching
  useEffect(() => {
    if (isInitialized && !token) {
      setAuthError(true);
    } else {
      setAuthError(false);
    }
  }, [isInitialized, token]);
  
  // Fetch chat groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        await fetchChatGroups();
      } catch (error) {
        // If we get an error fetching groups, check if it's auth related
        if (!token) {
          setAuthError(true);
        }
      }
    };
    
    if (!authError) {
      loadGroups();
    }
  }, [fetchChatGroups, authError, token]);
  
  // Select the first group if none is selected
  useEffect(() => {
    if (tripGroups.length > 0 && !selectedGroupId) {
      // Find the default group first
      const defaultGroup = tripGroups.find(group => group.isDefault);
      
      if (defaultGroup) {
        selectChatGroup(defaultGroup.id);
      } else if (tripGroups[0]) {
        selectChatGroup(tripGroups[0].id);
      }
    }
  }, [tripGroups, selectedGroupId, selectChatGroup]);
  
  // Connect to WebSocket when a group is selected
  useEffect(() => {
    if (selectedGroupId) {
      chatWsManager.connect(selectedGroupId, {
        onMessage: handleChatEvent,
        onError: (error) => {
          console.error('Chat WebSocket error:', error);
          // Check if it's an auth error
          if (error.message === 'Authentication failed') {
            setAuthError(true);
          }
        }
      });
      
      // Mark messages as read when selecting a group
      if (messages.length > 0) {
        markAsRead(selectedGroupId, messages[0].id);
      }
    }
    
    return () => {
      chatWsManager.disconnect();
    };
  }, [selectedGroupId, handleChatEvent, messages, markAsRead]);
  
  // Handle refreshing the messages
  const handleRefresh = async () => {
    if (!selectedGroupId) return;
    
    setIsRefreshing(true);
    await fetchMessages(selectedGroupId, true);
    setIsRefreshing(false);
  };
  
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (!selectedGroupId) return;
    
    sendMessage(selectedGroupId, content);
  };
  
  // Handle typing status change
  const handleTypingStatusChange = (isTyping: boolean) => {
    if (!selectedGroupId) return;
    
    setTypingStatus(selectedGroupId, isTyping);
  };
  
  // Handle retry after auth error
  const handleAuthRetry = async () => {
    try {
      await useAuthStore.getState().refreshSession();
      setAuthError(false);
      fetchChatGroups();
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
    }
  };
  
  // If there's an auth error, show the error component
  if (authError) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles(theme).container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={styles(theme).content}>
        <View style={styles(theme).sidebar}>
          <ChatGroupList
            groups={tripGroups}
            selectedGroupId={selectedGroupId}
            isLoading={isLoadingGroups}
            onSelectGroup={selectChatGroup}
            onRefresh={fetchChatGroups}
            isRefreshing={isRefreshing}
          />
        </View>
        <View style={styles(theme).chatArea}>
          {selectedGroupId ? (
            <>
              <ChatList
                messages={messages}
                isLoading={isLoadingMessages}
                hasMore={hasMore}
                onLoadMore={() => fetchMoreMessages(selectedGroupId)}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                typingUsers={currentTypingUsers}
              />
              <ChatInput
                onSend={handleSendMessage}
                onTypingStatusChange={handleTypingStatusChange}
              />
            </>
          ) : (
            <View style={styles(theme).emptyState}>
              <Text style={styles(theme).emptyStateText}>
                Select a chat to start messaging
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.default,
    // Hide on mobile
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  chatArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 