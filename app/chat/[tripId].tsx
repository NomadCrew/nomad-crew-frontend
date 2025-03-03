import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { MobileChatScreen } from '@/screens/chat/MobileChatScreen';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { StatusBar } from 'expo-status-bar';
import { logger } from '@/src/utils/logger';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ tripId: string }>();
  const tripId = params.tripId;
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { fetchChatGroups } = useChatStore();
  
  // Log the tripId for debugging
  useEffect(() => {
    console.log('Chat Route - tripId from params:', tripId);
    logger.debug('Chat Route', 'Mounted with tripId:', tripId);
  }, [tripId]);
  
  const handleBack = () => {
    router.back();
  };
  
  useEffect(() => {
    // Ensure tripId is a string before using it
    if (typeof tripId === 'string') {
      console.log('Fetching chat groups for tripId:', tripId);
      // Prefetch chat groups when the component mounts
      fetchChatGroups(tripId).catch(error => {
        console.error('Failed to fetch chat groups:', error);
      });
    }
  }, [tripId, fetchChatGroups]);
  
  // If no tripId is provided, show an error message
  if (!tripId) {
    console.error('No tripId provided to chat route');
    return (
      <View style={[styles.container, { backgroundColor: theme?.colors?.background?.default || '#FFFFFF' }]}>
        <StatusBar style={theme?.dark ? 'light' : 'dark'} />
        <Text style={{ color: theme?.colors?.content?.primary || '#000000', textAlign: 'center', padding: 20 }}>
          No trip ID provided. Cannot load chat.
        </Text>
      </View>
    );
  }
  
  // Use MobileChatScreen for smaller screens, ChatScreen for larger ones
  const isMobile = width < 768;
  
  return (
    <View style={[styles.container, { backgroundColor: theme?.colors?.background?.default || '#FFFFFF' }]}>
      <StatusBar style={theme?.dark ? 'light' : 'dark'} />
      {isMobile ? (
        <MobileChatScreen 
          tripId={tripId} 
          onBack={handleBack}
        />
      ) : (
        <ChatScreen 
          tripId={tripId}
          onBack={handleBack}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 