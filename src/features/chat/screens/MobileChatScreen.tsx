import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/features/chat/store';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { Trip } from '@/src/features/trips/types';
import { ChatList } from '../components/ChatList';
import { ChatInput } from '../components/ChatInput';
import { ChatAuthError } from '../components/ChatAuthError';
import { WebSocketManager } from '@/src/features/websocket/WebSocketManager';
import { Theme } from '@/src/theme/types';
import { StatusBar } from 'expo-status-bar';
import { StatusBarStyle } from 'expo-status-bar/build/StatusBar.types';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [authError, setAuthError] = useState(false);
  
  // Auth store state
  const { token, isInitialized } = useAuthStore();
  
  // Chat store state and actions
  const {
    messagesByTripId,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markAsRead,
    initializeStore,
    setTypingStatus
  } = useChatStore();
  
  // Trip store to get trip name
  const { getTripById } = useTripStore();
  const trip = getTripById(tripId);
  const tripName = trip?.name || 'Trip Chat';
  
  // Get messages for the trip
  const messages = messagesByTripId[tripId] || [];
  const hasMore = hasMoreMessages[tripId] || false;
  
  // Get typing users for the trip
  const currentTypingUsers = typingUsers[tripId] || [];
  
  // Check for authentication before fetching
  useEffect(() => {
    if (isInitialized && !token) {
      setAuthError(true);
    } else {
      setAuthError(false);
    }
  }, [isInitialized, token]);
  
  // Initialize store with persisted data
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        await initializeStore();
        logger.debug('Mobile Chat Screen', 'Initialized store with persisted data');
      } catch (error) {
        logger.error('Mobile Chat Screen', 'Failed to initialize store with persisted data:', error);
      }
    };
    
    loadPersistedData();
  }, [initializeStore]);
  
  // Fetch messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      logger.info('Mobile Chat Screen', `Fetching messages for trip ${tripId}...`);
      try {
        await fetchMessages(tripId);
        logger.info('Mobile Chat Screen', `Successfully fetched messages for trip ${tripId}`);
      } catch (error) {
        logger.error('Mobile Chat Screen', `Error fetching messages for trip ${tripId}:`, error);
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
  
  // Handle refreshing the messages
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages(tripId, true);
    setIsRefreshing(false);
  };
  
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    logger.info('Mobile Chat Screen', `handleSendMessage called with content: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
    
    if (!tripId) {
      logger.error('Mobile Chat Screen', 'Cannot send message: tripId is undefined');
      return;
    }
    
    // Check WebSocket connection
    const wsManager = WebSocketManager.getInstance();
    const isConnected = wsManager.isConnected();
    logger.info('Mobile Chat Screen', `WebSocket connection status before sending: ${isConnected ? 'connected' : 'disconnected'}`);
    
    if (!isConnected) {
      logger.warn('Mobile Chat Screen', 'WebSocket not connected, message may not be delivered');
      // Don't attempt to reconnect here as it's managed at the trip level
      // Just inform the user that the message might not be delivered
    }
    
    try {
      logger.info('Mobile Chat Screen', `Sending message in trip ${tripId}: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
      sendMessage({ tripId, content });
      logger.info('Mobile Chat Screen', 'sendMessage function called successfully');
    } catch (error) {
      logger.error('Mobile Chat Screen', 'Error calling sendMessage:', error);
    }
  };
  
  // Handle typing status change
  const handleTypingStatusChange = (isTyping: boolean) => {
    setTypingStatus(tripId, isTyping);
  };
  
  // Handle retry after auth error
  const handleAuthRetry = async () => {
    try {
      await useAuthStore.getState().refreshSession();
      setAuthError(false);
      fetchMessages(tripId);
    } catch (error) {
      logger.error('AUTH', 'Failed to refresh authentication:', error);
    }
  };
  
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme?.colors?.surface?.default || '#FFFFFF',
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme?.colors?.border?.default || '#EEEEEE',
        backgroundColor: theme?.colors?.surface?.default || '#FFFFFF',
        minHeight: 60,
      } as ViewStyle,
      backButton: {
        marginRight: 16,
        padding: 4,
      } as ViewStyle,
      headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600' as const,
        color: theme?.colors?.content?.primary || '#1A1A1A',
      } as TextStyle,
      chatContainer: {
        flex: 1,
      } as ViewStyle,
      emptyState: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: 20,
      } as ViewStyle,
      emptyStateText: {
        fontSize: 16,
        color: theme?.colors?.content?.secondary || '#757575',
        textAlign: 'center' as const,
        marginBottom: 20,
      } as TextStyle,
      statusBarStyle: (theme?.dark ? 'light' : 'dark') as StatusBarStyle,
      loadingContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: 20,
      } as ViewStyle,
      loadingText: {
        fontSize: 16,
        color: theme?.colors?.content?.secondary || '#757575',
        textAlign: 'center' as const,
        marginTop: 12,
      } as TextStyle,
    });
  });
  
  // If there's an auth error, show the error component
  if (authError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={styles.statusBarStyle} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={styles.statusBarStyle} />
      
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={theme?.colors?.content?.primary || '#1A1A1A'} 
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {tripName}
        </Text>
      </View>
      
      <View style={styles.chatContainer}>
        {isLoadingMessages && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme?.colors?.content?.primary || '#1A1A1A'} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No messages found</Text>
              </View>
            ) : (
              <ChatList
                messages={messages}
                currentTypingUsers={currentTypingUsers}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onSendMessage={handleSendMessage}
                onTypingStatusChange={handleTypingStatusChange}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}; 