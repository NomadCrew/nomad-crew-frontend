import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatAuthError } from '@/components/chat/ChatAuthError';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/src/utils/logger';
import { useTripStore } from '@/src/store/useTripStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/src/theme/types';

interface ChatScreenProps {
  tripId: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId, onBack }) => {
  logger.info('Chat Screen', `Rendering ChatScreen for trip ${tripId}`);
  
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Auth store state
  const { token, isInitialized, user } = useAuthStore();
  
  // Chat store state and actions
  const {
    messagesByTripId,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchMessages,
    fetchMoreMessages,
    connectToChat,
    disconnectFromChat,
    error
  } = useChatStore();
  
  // Trip store to get trip name
  const { getTripById } = useTripStore();
  const trip = getTripById(tripId);
  const tripName = trip?.name || 'Trip Chat';
  
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
  
  // Connect to chat and fetch messages
  useEffect(() => {
    if (tripId && user && !authError) {
      logger.info('Chat Screen', `Connecting to chat for trip ${tripId}`);
      
      // Connect to WebSocket for this trip
      connectToChat(tripId);
      
      // Fetch messages for this trip
      fetchMessages(tripId);
      
      // Cleanup on unmount
      return () => {
        logger.info('Chat Screen', `Disconnecting from chat for trip ${tripId}`);
        disconnectFromChat(tripId);
      };
    }
  }, [tripId, user, authError, connectToChat, fetchMessages, disconnectFromChat]);
  
  const messages = messagesByTripId[tripId] || [];
  const hasMore = hasMoreMessages[tripId] || false;
  
  const handleRefresh = async () => {
    logger.info('Chat Screen', `Manually refreshing messages for trip ${tripId}`);
    setIsRefreshing(true);
    await fetchMessages(tripId, true);
    setIsRefreshing(false);
    logger.info('Chat Screen', `Completed manual refresh for trip ${tripId}`);
  };
  
  const handleLoadMore = () => {
    logger.info('Chat Screen', `Loading more messages for trip ${tripId}`);
    fetchMoreMessages(tripId);
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
  
  // Common container with safe area insets
  const containerStyle = {
    flex: 1,
    backgroundColor: theme?.colors?.background?.default || '#FFFFFF',
  };
  
  // If there's an auth error, show the error component
  if (authError) {
    logger.warn('Chat Screen', 'Rendering auth error component due to authentication issues');
    return (
      <View style={containerStyle}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={{ paddingTop: insets.top }} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </View>
    );
  }
  
  // Show loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <View style={containerStyle}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={{ paddingTop: insets.top }} />
        <View style={styles(theme).header}>
          {onBack && (
            <TouchableOpacity 
              style={styles(theme).backButton} 
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
          <Text style={styles(theme).headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {tripName}
          </Text>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme?.colors?.primary?.main} />
          <Text style={styles(theme).loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error && messages.length === 0) {
    return (
      <View style={containerStyle}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={{ paddingTop: insets.top }} />
        <View style={styles(theme).header}>
          {onBack && (
            <TouchableOpacity 
              style={styles(theme).backButton} 
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
          <Text style={styles(theme).headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {tripName}
          </Text>
        </View>
        <View style={styles(theme).errorContainer}>
          <Text style={styles(theme).errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles(theme).retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles(theme).retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  logger.debug('Chat Screen', `Rendering chat UI with ${messages.length} messages`);
  return (
    <View style={containerStyle}>
      <StatusBar style={theme?.dark ? 'light' : 'dark'} />
      
      <View style={{ paddingTop: insets.top }} />
      
      <View style={styles(theme).header}>
        {onBack && (
          <TouchableOpacity 
            style={styles(theme).backButton} 
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
        <Text style={styles(theme).headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {tripName}
        </Text>
      </View>
      
      <View style={[styles(theme).content, { 
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom
      }]}>
        <View style={styles(theme).chatArea}>
          <ChatList
            messages={messages}
            isLoading={isLoadingMessages}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            typingUsers={typingUsers[tripId] || []}
            tripId={tripId}
          />
          <ChatInput tripId={tripId} />
        </View>
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme?.colors?.border?.default || '#E0E0E0',
    backgroundColor: theme?.colors?.background?.elevated || '#FFFFFF',
    zIndex: 10,
    minHeight: 56,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme?.colors?.content?.primary || '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme?.colors?.content?.secondary || '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme?.colors?.error?.main || '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme?.colors?.primary?.main || '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 