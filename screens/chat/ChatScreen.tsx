import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatGroupList } from '@/components/chat/ChatGroupList';
import { ChatAuthError } from '@/components/chat/ChatAuthError';
import { WebSocketManager } from '@/src/websocket/WebSocketManager';
import { Theme } from '@/src/theme/types';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/src/utils/logger';

interface ChatScreenProps {
  tripId: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId, onBack }) => {
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
    fetchChatGroups,
    selectChatGroup,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markAsRead
  } = useChatStore();
  
  // Filter groups by tripId
  const tripGroups = groups.filter(group => group.trip_id === tripId);
  
  // Get messages for the selected group
  const messages = selectedGroupId ? messagesByGroupId[selectedGroupId] || [] : [];
  const hasMore = selectedGroupId ? hasMoreMessages[selectedGroupId] || false : false;
  
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
        await fetchChatGroups(tripId);
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
  }, [fetchChatGroups, authError, token, tripId]);
  
  // Select the first group if none is selected
  useEffect(() => {
    if (tripGroups.length > 0 && !selectedGroupId) {
      selectChatGroup(tripGroups[0].id);
    }
  }, [tripGroups, selectedGroupId, selectChatGroup]);
  
  // Connect to WebSocket when a group is selected
  useEffect(() => {
    let isActive = true;
    let wsManager: WebSocketManager | null = null;
    
    const connectToWebSocket = async () => {
      if (!tripId || !isActive) return;
      
      try {
        logger.debug('Chat Screen', `Ensuring WebSocket connection for trip ${tripId}`);
        
        // Use the trip WebSocket manager
        wsManager = WebSocketManager.getInstance();
        await wsManager.connect(tripId);
        
        // Mark messages as read when selecting a group
        if (isActive && selectedGroupId && messages.length > 0 && messages[0]?.message?.id) {
          markAsRead(selectedGroupId, messages[0].message.id);
        }
      } catch (error) {
        logger.error('Chat Screen', 'Failed to connect to WebSocket:', error);
      }
    };
    
    connectToWebSocket();
    
    return () => {
      isActive = false;
      if (wsManager) {
        wsManager.disconnect();
        wsManager = null;
      }
    };
  }, [tripId]); // Only reconnect when tripId changes
  
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
  
  // Handle retry after auth error
  const handleAuthRetry = async () => {
    try {
      await useAuthStore.getState().refreshSession();
      setAuthError(false);
      fetchChatGroups(tripId);
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
        {onBack && Platform.OS !== 'web' && (
          <View style={styles(theme).mobileHeader}>
            <TouchableOpacity 
              style={styles(theme).backButton} 
              onPress={onBack}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.colors.content.primary} 
              />
              <Text style={styles(theme).headerTitle}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles(theme).sidebar}>
          <ChatGroupList
            groups={tripGroups}
            selectedGroupId={selectedGroupId}
            isLoading={isLoadingGroups}
            onSelectGroup={selectChatGroup}
            onRefresh={() => fetchChatGroups(tripId)}
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
              />
              <ChatInput
                onSend={handleSendMessage}
                disabled={!selectedGroupId}
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
  mobileHeader: {
    display: Platform.OS === 'web' ? 'none' : 'flex',
    height: 50,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: theme.colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.default,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  chatArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 0 : 50,
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