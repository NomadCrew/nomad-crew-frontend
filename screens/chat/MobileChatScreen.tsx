import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';

interface MobileChatScreenProps {
  tripId: string;
  onBack?: () => void;
}

export const MobileChatScreen: React.FC<MobileChatScreenProps> = ({ 
  tripId,
  onBack 
}) => {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGroupList, setShowGroupList] = useState(false);
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
  
  // Get the selected group
  const selectedGroup = selectedGroupId 
    ? tripGroups.find(group => group.id === selectedGroupId) 
    : null;
  
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
  
  // Handle selecting a group
  const handleSelectGroup = (groupId: string) => {
    selectChatGroup(groupId);
    setShowGroupList(false); // Hide the group list after selection
  };
  
  // Toggle the group list visibility
  const toggleGroupList = () => {
    setShowGroupList(!showGroupList);
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
        <View style={styles(theme).header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles(theme).backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles(theme).headerTitle}>Chat</Text>
        </View>
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles(theme).container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Header with back button and group name */}
      <View style={styles(theme).header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles(theme).backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles(theme).headerTitle}>
          {selectedGroup ? selectedGroup.name : 'Chat'}
        </Text>
        <TouchableOpacity onPress={toggleGroupList} style={styles(theme).groupButton}>
          <Ionicons 
            name={showGroupList ? "close" : "list"} 
            size={24} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Main content area */}
      <View style={styles(theme).content}>
        {/* Slide-in group list */}
        {showGroupList && (
          <View style={styles(theme).groupListContainer}>
            <ChatGroupList
              groups={tripGroups}
              selectedGroupId={selectedGroupId}
              isLoading={isLoadingGroups}
              onSelectGroup={handleSelectGroup}
              onRefresh={fetchChatGroups}
              isRefreshing={isRefreshing}
            />
          </View>
        )}
        
        {/* Chat messages and input */}
        <View style={styles(theme).chatContainer}>
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
                {tripGroups.length > 0 
                  ? 'Select a chat to start messaging' 
                  : 'No chat groups available for this trip'}
              </Text>
              {tripGroups.length > 0 && (
                <TouchableOpacity 
                  style={styles(theme).emptyStateButton}
                  onPress={toggleGroupList}
                >
                  <Text style={styles(theme).emptyStateButtonText}>
                    Show Chat Groups
                  </Text>
                </TouchableOpacity>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.section.padding,
    paddingVertical: theme.spacing.stack.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.card,
  },
  backButton: {
    marginRight: theme.spacing.stack.sm,
    padding: theme.spacing.stack.xs,
  },
  groupButton: {
    padding: theme.spacing.stack.xs,
  },
  headerTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  groupListContainer: {
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  chatContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.stack.sm,
  },
  emptyStateButton: {
    padding: theme.spacing.stack.sm,
    backgroundColor: theme.colors.background.card,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.spacing.stack.sm,
  },
  emptyStateButtonText: {
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
}); 