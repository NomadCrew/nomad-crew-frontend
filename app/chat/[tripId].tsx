import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ChatScreen, MobileChatScreen } from '@/src/features/chat/screens';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/features/chat/store';
import { StatusBar } from 'expo-status-bar';
import { logger } from '@/src/utils/logger';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ tripId: string }>();
  const tripId = params.tripId;
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { fetchMessages, initializeStore } = useChatStore();
  
  // Log the tripId for debugging
  useEffect(() => {
    logger.debug('TRIP', 'Chat Route mounted with tripId:', tripId);
  }, [tripId]);
  
  const handleBack = () => {
    router.back();
  };
  
  // Initialize store with persisted data
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        await initializeStore();
        logger.debug('Chat Route', 'Initialized store with persisted data');
      } catch (error) {
        logger.error('Chat Route', 'Failed to initialize store with persisted data:', error);
      }
    };
    
    loadPersistedData();
  }, [initializeStore]);
  
  // If no tripId is provided, show an error message
  if (!tripId) {
    logger.error('TRIP', 'No tripId provided to chat route');
    return (
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: theme?.colors?.background?.default || '#FFFFFF' }]}>
          <StatusBar style={theme?.dark ? 'light' : 'dark'} />
          <Text style={{ color: theme?.colors?.content?.primary || '#000000', textAlign: 'center', padding: 20 }}>
            No trip ID provided. Cannot load chat.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }
  
  // Use MobileChatScreen for smaller screens, ChatScreen for larger ones
  const isMobile = width < 768;
  
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 