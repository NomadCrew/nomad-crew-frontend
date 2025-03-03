import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
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
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';
import { useTripStore } from '@/src/store/useTripStore';

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
  
  // Log the tripId for debugging
  useEffect(() => {
    logger.debug('MobileChatScreen', 'Mounted with tripId:', tripId);
    
    // Set the selected trip in the trip store
    const trip = useTripStore.getState().getTripById(tripId);
    if (trip) {
      useTripStore.getState().setSelectedTrip(trip);
    }

    // Cleanup when unmounting
    return () => {
      useTripStore.getState().setSelectedTrip(null);
    };
  }, [tripId]);
  
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const textPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const textSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const backgroundDefault = theme?.colors?.background?.default || '#FFFFFF';
    const backgroundCard = theme?.colors?.background?.card || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const spacingSectionPadding = theme?.spacing?.layout?.section?.padding || 16;
    const spacingStackSm = theme?.spacing?.stack?.sm || 12;
    const spacingStackXs = theme?.spacing?.stack?.xs || 8;
    const typographySizeLg = theme?.typography?.size?.lg || 18;
    const typographySizeMd = theme?.typography?.size?.md || 16;
    const isDark = theme?.dark || false;
    
    return {
      container: {
        flex: 1,
        backgroundColor: backgroundDefault,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacingSectionPadding,
        paddingVertical: spacingStackSm,
        borderBottomWidth: 1,
        borderBottomColor: borderDefault,
        backgroundColor: backgroundCard,
      },
      backButton: {
        marginRight: spacingStackSm,
        padding: spacingStackXs,
      },
      groupButton: {
        padding: spacingStackXs,
      },
      headerTitle: {
        fontSize: typographySizeLg,
        fontWeight: 'bold',
        color: textPrimary,
      },
      content: {
        flex: 1,
      },
      groupListContainer: {
        maxHeight: 300,
        borderBottomWidth: 1,
        borderBottomColor: borderDefault,
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
        color: textSecondary,
        marginBottom: spacingStackSm,
      },
      emptyStateButton: {
        padding: spacingStackSm,
        backgroundColor: backgroundCard,
        borderWidth: 1,
        borderColor: borderDefault,
        borderRadius: spacingStackSm,
      },
      emptyStateButtonText: {
        fontSize: typographySizeMd,
        fontWeight: 'bold',
        color: textPrimary,
      },
      statusBarStyle: isDark ? 'light' : 'dark',
    };
  });
  
  // Filter groups by tripId
  const tripGroups = groups.filter(group => group.tripId === tripId);
  
  // Get messages for the selected group
  const messages = selectedGroupId ? messagesByGroupId[selectedGroupId] || [] : [];
  const hasMore = selectedGroupId ? hasMoreMessages[selectedGroupId] || false : false;
  
  // Safely access typingUsers with a null check
  const currentTypingUsers = selectedGroupId && typingUsers && typingUsers[selectedGroupId] 
    ? typingUsers[selectedGroupId] 
    : [];
  
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
    let isActive = true;
    
    const connectToWebSocket = async () => {
      if (!selectedGroupId || !isActive) return;
      
      try {
        // Use the trip WebSocket manager instead of the chat WebSocket manager
        const wsManager = WebSocketManager.getInstance();
        await wsManager.connect(tripId);
        
        // Mark messages as read when selecting a group
        if (isActive && messages.length > 0 && messages[0]?.message?.id) {
          markAsRead(selectedGroupId, messages[0].message.id);
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        if (isActive && error.message === 'Authentication failed') {
          setAuthError(true);
        }
      }
    };
    
    connectToWebSocket();
    
    return () => {
      isActive = false;
      // Don't disconnect from the trip websocket when leaving the chat screen
      // It will be managed by the trip detail screen
    };
  }, [selectedGroupId, messages, markAsRead, tripId]);
  
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
      fetchChatGroups(tripId);
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
    }
  };
  
  // If there's an auth error, show the error component
  if (authError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={styles.statusBarStyle} />
        <ChatAuthError onRetry={handleAuthRetry} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={styles.statusBarStyle} />
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme?.colors?.content?.primary || '#1A1A1A'} 
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {selectedGroup ? selectedGroup.name : 'Chat'}
        </Text>
        <TouchableOpacity 
          style={styles.groupButton} 
          onPress={toggleGroupList}
        >
          <Ionicons 
            name="people" 
            size={24} 
            color={theme?.colors?.content?.primary || '#1A1A1A'} 
          />
        </TouchableOpacity>
      </View>
      
      {showGroupList && (
        <View style={styles.groupListContainer}>
          <ChatGroupList
            groups={tripGroups}
            selectedGroupId={selectedGroupId}
            isLoading={isLoadingGroups}
            onSelectGroup={handleSelectGroup}
            onRefresh={() => fetchChatGroups(tripId)}
            isRefreshing={isRefreshing}
          />
        </View>
      )}
      
      <View style={styles.chatContainer}>
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a chat group to start messaging
            </Text>
            {tripGroups.length > 0 && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={toggleGroupList}
              >
                <Text style={styles.emptyStateButtonText}>
                  Show Chat Groups
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}; 