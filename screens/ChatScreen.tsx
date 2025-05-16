import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/types/navigation';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/src/store/useChatStore';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useThemedStyles } from '@/src/theme/utils';
import { useTripStore } from '@/src/store/useTripStore';
import { useAuth } from '@/src/hooks/useAuth';
import { HeaderWithBack } from '@/components/common/HeaderWithBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

export const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { tripId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { 
    messagesByTripId, 
    fetchMessages,
    fetchMoreMessages,
    isLoading, 
    error,
    connectToChat,
    disconnectFromChat,
    typingUsers,
    hasMoreMessages
  } = useChatStore();
  
  const { trips, getTripById } = useTripStore();
  const [trip, setTrip] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
      },
      content: {
        flex: 1,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.stack.lg,
      },
      errorText: {
        color: theme.colors.status.error.content,
        textAlign: 'center',
        marginBottom: theme.spacing.stack.md,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.stack.lg,
      },
      emptyText: {
        color: theme.colors.content.secondary,
        textAlign: 'center',
        fontSize: theme.typography.size?.md || 16,
      },
    });
  });
  
  // Fetch trip details
  useEffect(() => {
    if (tripId) {
      // Use getTripById as a simpler way to get trip info
      const tripInfo = getTripById(tripId);
      if (tripInfo) {
        setTrip(tripInfo);
      }
    }
  }, [tripId, getTripById]);
  
  // Set trip from store
  useEffect(() => {
    const currentTrip = trips.find(t => t.id === tripId);
    if (currentTrip) {
      setTrip(currentTrip);
    }
  }, [trips, tripId]);
  
  // Connect to chat and fetch messages
  useEffect(() => {
    if (tripId && user) {
      // Connect to WebSocket for this trip
      connectToChat(tripId);
      
      // Fetch messages for this trip
      fetchMessages(tripId);
      
      // Set screen title
      if (trip?.name) {
        navigation.setOptions({
          headerTitle: trip.name,
        });
      }
      
      // Cleanup on unmount
      return () => {
        disconnectFromChat(tripId);
      };
    }
  }, [tripId, user, connectToChat, fetchMessages, disconnectFromChat, trip, navigation]);
  
  const messages = messagesByTripId[tripId] || [];
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages(tripId, true);
    setIsRefreshing(false);
  };
  
  const handleLoadMore = () => {
    fetchMoreMessages(tripId);
  };
  
  // Common container with safe area insets
  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right
  };
  
  if (isLoading && messages.length === 0) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }
  
  if (error && messages.length === 0) {
    return (
      <View style={containerStyle}>
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={containerStyle}>
      <HeaderWithBack 
        title={trip?.name || 'Trip Chat'} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <View style={styles.content}>
        <ChatList 
          messages={messages}
          isLoading={isLoading}
          hasMore={hasMoreMessages[tripId] || false}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          typingUsers={typingUsers[tripId] || []}
          tripId={tripId}
        />
      </View>
      
      <ChatInput tripId={tripId} />
    </View>
  );
}; 