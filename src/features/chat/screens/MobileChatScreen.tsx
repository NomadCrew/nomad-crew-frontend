import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/features/chat/store';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store';
import { ChatList } from '../components/ChatList';
import { ChatInput } from '../components/ChatInput';
import { ChatAuthError } from '../components/ChatAuthError';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { logger } from '@/src/utils/logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebSocketManager } from '@/src/features/websocket/WebSocketManager';
type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

interface MobileChatScreenProps {
  tripId: string;
  onBack?: () => void;
}

export const MobileChatScreen: React.FC<MobileChatScreenProps> = ({ tripId, onBack }) => {
  const { theme } = useAppTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Auth store state
  const { token, isInitialized } = useAuthStore();

  // Chat store state and actions
  const { messagesByTripId, isLoadingMessages, typingUsers, fetchMessages, initializeStore } =
    useChatStore();

  // Trip store to get trip name
  const { getTripById } = useTripStore();
  const trip = getTripById(tripId);
  const tripName = trip?.name || 'Trip Chat';

  // Get messages for the trip
  const messages = messagesByTripId[tripId] || [];

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
        logger.error(
          'Mobile Chat Screen',
          'Failed to initialize store with persisted data:',
          error
        );
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

  // Monitor WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      const wsManager = WebSocketManager.getInstance();
      setIsRealtimeConnected(wsManager.isConnected());
    };

    // Check immediately
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  // Handle refreshing the messages
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages(tripId, true);
    setIsRefreshing(false);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.colors?.surface?.default || '#FFFFFF',
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors?.border?.default || '#EEEEEE',
      backgroundColor: theme?.colors?.surface?.default || '#FFFFFF',
      minHeight: 60,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme?.colors?.content?.primary || '#1A1A1A',
    },
    chatContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme?.colors?.content?.secondary || '#757575',
      textAlign: 'center' as const,
      marginBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      color: theme?.colors?.content?.secondary || '#757575',
      textAlign: 'center' as const,
      marginTop: 12,
    },
  });

  const statusBarStyle: StatusBarStyle = theme?.dark ? 'light' : 'dark';

  // If there's an auth error, show the error component
  if (authError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={statusBarStyle} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={statusBarStyle} />

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
        {isRealtimeConnected ? (
          <MaterialIcons name="signal-cellular-alt" size={20} color={theme.colors.success.main} />
        ) : (
          <MaterialIcons name="signal-cellular-off" size={20} color={theme.colors.error.main} />
        )}
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
                typingUsers={currentTypingUsers}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                tripId={tripId}
              />
            )}
            <ChatInput tripId={tripId} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};
