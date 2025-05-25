import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/features/chat/store';
import { useAuthStore } from '@/src/features/auth/store';
import { ChatList } from '../components/ChatList';
import { ChatInput } from '../components/ChatInput';
import { ChatAuthError } from '../components/ChatAuthError';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/src/utils/logger';
import { useTripStore } from '@/src/features/trips/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/src/theme/types';
import { useLocalSearchParams, router } from 'expo-router';

// Supabase Realtime imports
import { useChatMessages } from '@/src/features/trips/hooks/useChatMessages';
import { usePresence } from '@/src/features/trips/hooks/usePresence';
import { useReactions } from '@/src/features/trips/hooks/useReactions';
import { useReadReceipts } from '@/src/features/trips/hooks/useReadReceipts';

interface ChatScreenProps {
  tripId: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId, onBack }) => {
  logger.info('Chat Screen', `Rendering ChatScreen for trip ${tripId}`);
  
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Auth store state
  const { token, isInitialized, user } = useAuthStore();
  
  // Supabase Realtime hooks
  const supabaseChatMessages = useChatMessages({ 
    tripId, 
    autoConnect: !!user && !authError 
  });
  const presence = usePresence({ 
    tripId, 
    autoConnect: !!user && !authError 
  });
  const reactions = useReactions({ 
    tripId, 
    autoConnect: !!user && !authError 
  });
  const readReceipts = useReadReceipts({ 
    tripId, 
    autoConnect: !!user && !authError 
  });
  
  // Legacy chat store state and actions (for compatibility)
  const {
    fetchMessages,
    connectToChat,
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
  
  // Initialize chat store for compatibility with existing components
  useEffect(() => {
    if (tripId && user && !authError) {
      logger.info('Chat Screen', `Using Supabase Realtime for trip ${tripId}`);
      // Initialize chat store for compatibility with existing components
      connectToChat(tripId);
      fetchMessages(tripId);
    }
  }, [tripId, user, authError, connectToChat, fetchMessages]);
  
  // Use Supabase Realtime data
  const messages = supabaseChatMessages.messages;
  const isLoading = supabaseChatMessages.isLoading;
  const hasMore = supabaseChatMessages.hasMore;
  const currentError = supabaseChatMessages.error;
  const currentTypingUsers = presence.typingUsers;
  
  const handleRefresh = async () => {
    logger.info('Chat Screen', `Manually refreshing messages for trip ${tripId}`);
    setIsRefreshing(true);
    await supabaseChatMessages.refetch();
    setIsRefreshing(false);
    logger.info('Chat Screen', `Completed manual refresh for trip ${tripId}`);
  };
  
  const handleLoadMore = () => {
    logger.info('Chat Screen', `Loading more messages for trip ${tripId}`);
    supabaseChatMessages.loadMore();
  };
  
  // Handle retry after auth error
    const handleAuthRetry = async () => {
    logger.info('Chat Screen', 'Attempting to refresh authentication session');
    try {
      await useAuthStore.getState().refreshSession();
      setAuthError(false);
      logger.info('Chat Screen', 'Authentication refreshed successfully, fetching messages');
      supabaseChatMessages.refetch();
    } catch (error) {
      logger.error('Chat Screen', 'Failed to refresh authentication:', error);
    }
  };
  
  // Common container with safe area insets
  const containerStyle = {
    flex: 1,
    backgroundColor: theme?.colors?.background?.default || '#FFFFFF',
  };
  
  // Handle connection errors from Supabase Realtime hooks
  if (supabaseChatMessages.error || presence.error || reactions.error || readReceipts.error) {
    const errorMessage = supabaseChatMessages.error || presence.error || reactions.error || readReceipts.error;
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
          <Text style={styles(theme).errorText}>Connection Error</Text>
          <Text style={styles(theme).loadingText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles(theme).retryButton} 
            onPress={() => supabaseChatMessages.refetch()}
          >
            <Text style={styles(theme).retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
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
  if (isLoading && messages.length === 0) {
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
  if (currentError && messages.length === 0) {
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
          <Text style={styles(theme).errorText}>{currentError}</Text>
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
  
  logger.debug('Chat Screen', `Rendering chat UI with ${messages.length} messages using Supabase Realtime`);
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
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            typingUsers={currentTypingUsers}
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
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
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
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    padding: 10,
    backgroundColor: theme?.colors?.primary?.main,
    borderRadius: 5,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 