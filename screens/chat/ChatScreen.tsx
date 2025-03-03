import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
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
  logger.info('Chat Screen', `Rendering ChatScreen for trip ${tripId}`);
  
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Auth store state
  const { token, isInitialized } = useAuthStore();
  
  // Chat store state and actions
  const {
    messagesByTripId,
    isLoadingMessages,
    hasMoreMessages,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markAsRead,
    initializeStore,
    setTypingStatus
  } = useChatStore();
  
  // Get messages for the trip
  const messages = messagesByTripId[tripId] || [];
  const hasMore = hasMoreMessages[tripId] || false;
  
  // Check for authentication before fetching
  useEffect(() => {
    logger.debug('Chat Screen', `Auth state changed - isInitialized: ${isInitialized}, token exists: ${!!token}`);
    if (isInitialized && !token) {
      logger.warn('Chat Screen', 'Authentication error: No token available');
      setAuthError(true);
    } else {
      setAuthError(false);
    }
  }, [isInitialized, token]);
  
  // Initialize store with persisted data
  useEffect(() => {
    const loadPersistedData = async () => {
      logger.info('Chat Screen', 'Loading persisted chat data...');
      try {
        await initializeStore();
        logger.info('Chat Screen', 'Successfully initialized store with persisted data');
      } catch (error) {
        logger.error('Chat Screen', 'Failed to initialize store with persisted data:', error);
      }
    };
    
    loadPersistedData();
  }, [initializeStore]);
  
  // Fetch messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      logger.info('Chat Screen', `Fetching messages for trip ${tripId}...`);
      try {
        await fetchMessages(tripId);
        logger.info('Chat Screen', `Successfully fetched messages for trip ${tripId}`);
      } catch (error) {
        logger.error('Chat Screen', `Error fetching messages for trip ${tripId}:`, error);
        // If we get an error fetching messages, check if it's auth related
        if (!token) {
          setAuthError(true);
        }
      }
    };
    
    if (!authError) {
      loadMessages();
    }
  }, [fetchMessages, authError, token, tripId]);
  
  // WebSocket connection is now managed at the trip level
  // No need to connect/disconnect here
  
  // Handle refreshing the messages
  const handleRefresh = async () => {
    logger.info('Chat Screen', `Manually refreshing messages for trip ${tripId}`);
    setIsRefreshing(true);
    await fetchMessages(tripId, true);
    setIsRefreshing(false);
    logger.info('Chat Screen', `Completed manual refresh for trip ${tripId}`);
  };
  
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    logger.info('Chat Screen', `handleSendMessage called with content: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
    
    if (!tripId) {
      logger.error('Chat Screen', 'Cannot send message: tripId is undefined');
      return;
    }
    
    // Check WebSocket connection
    const wsManager = WebSocketManager.getInstance();
    const isConnected = wsManager.isConnected();
    logger.info('Chat Screen', `WebSocket connection status before sending: ${isConnected ? 'connected' : 'disconnected'}`);
    
    if (!isConnected) {
      logger.warn('Chat Screen', 'WebSocket not connected, message may not be delivered');
      // Don't attempt to reconnect here as it's managed at the trip level
      // Just inform the user that the message might not be delivered
    }
    
    try {
      logger.info('Chat Screen', `Sending message in trip ${tripId}: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
      sendMessage({ tripId, content });
      logger.info('Chat Screen', 'sendMessage function called successfully');
    } catch (error) {
      logger.error('Chat Screen', 'Error calling sendMessage:', error);
    }
  };
  
  // Handle retry after auth error
  const handleAuthRetry = async () => {
    logger.info('Chat Screen', 'Attempting to refresh authentication session');
    try {
      await useAuthStore.getState().refreshSession();
      setAuthError(false);
      logger.info('Chat Screen', 'Authentication refreshed successfully, fetching messages');
      fetchMessages(tripId);
    } catch (error) {
      logger.error('Chat Screen', 'Failed to refresh authentication:', error);
    }
  };
  
  // If there's an auth error, show the error component
  if (authError) {
    logger.warn('Chat Screen', 'Rendering auth error component due to authentication issues');
    return (
      <SafeAreaView style={styles(theme).container}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }
  
  logger.debug('Chat Screen', `Rendering chat UI with ${messages.length} messages`);
  return (
    <SafeAreaView style={styles(theme).container}>
      <StatusBar style={theme?.dark ? 'light' : 'dark'} />
      
      <View style={styles(theme).header}>
        {onBack && (
          <TouchableOpacity 
            style={styles(theme).backButton} 
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme?.colors?.content?.primary || '#1A1A1A'} 
            />
          </TouchableOpacity>
        )}
        <Text style={styles(theme).headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Chat
        </Text>
      </View>
      
      <View style={styles(theme).content}>
        {isLoadingMessages && messages.length === 0 ? (
          <View style={styles(theme).loadingContainer}>
            <ActivityIndicator size="large" color={theme?.colors?.primary?.main} />
            <Text style={styles(theme).loadingText}>Loading chat...</Text>
          </View>
        ) : (
          <View style={styles(theme).chatArea}>
            <ChatList
              messages={messages}
              isLoading={isLoadingMessages}
              hasMore={hasMore}
              onLoadMore={() => {
                logger.info('Chat Screen', `Loading more messages for trip ${tripId}`);
                fetchMoreMessages(tripId);
              }}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <ChatInput
              tripId={tripId}
              onSend={handleSendMessage}
              onTypingStatusChange={(isTyping) => {
                logger.debug('Chat Screen', `User typing status changed to: ${isTyping ? 'typing' : 'not typing'}`);
                setTypingStatus(tripId, isTyping);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.colors?.background?.default || '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme?.colors?.border?.default || '#E0E0E0',
    backgroundColor: theme?.colors?.background?.elevated || '#FFFFFF',
    zIndex: 10,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme?.colors?.content?.primary || '#1A1A1A',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  chatArea: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme?.colors?.content?.secondary || '#757575',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: theme?.colors?.content?.secondary || '#757575',
    textAlign: 'center',
    marginTop: 12,
  },
}); 