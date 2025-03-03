import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { useThemedStyles } from '@/src/theme/utils';
import { logger } from '@/src/utils/logger';

interface ChatInputProps {
  tripId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ tripId }) => {
  logger.debug('Chat Input', `Rendering ChatInput for trip ${tripId}`);
  
  const { theme } = useTheme();
  const { sendMessage, setTypingStatus, isSending } = useChatStore();
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Log when the component mounts and unmounts
  useEffect(() => {
    logger.debug('Chat Input', `ChatInput mounted for trip ${tripId}`);
    
    return () => {
      logger.debug('Chat Input', `ChatInput unmounted for trip ${tripId}`);
      // Clear any typing timeout when unmounting
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Ensure typing status is set to false when unmounting
      setTypingStatus(tripId, false);
    };
  }, [tripId, setTypingStatus]);
  
  // Log when sending state changes
  useEffect(() => {
    if (isSending) {
      logger.debug('Chat Input', 'Message sending in progress');
    }
  }, [isSending]);
  
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.stack.md,
        paddingVertical: theme.spacing.stack.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.default,
        backgroundColor: theme.colors.background.surface,
      },
      input: {
        flex: 1,
        backgroundColor: theme.colors.background.muted,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.stack.md,
        paddingVertical: theme.spacing.stack.sm,
        color: theme.colors.content.primary,
        fontSize: theme.typography.size.md,
        maxHeight: 100,
      },
      sendButton: {
        marginLeft: theme.spacing.stack.sm,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
      },
      disabledSendButton: {
        backgroundColor: theme.colors.primary.muted,
      },
    });
  });

  // Handle typing status changes
  const handleTypingStatus = useCallback((text: string) => {
    const newIsTyping = text.length > 0;
    
    // Only trigger if the typing status changed
    if (newIsTyping !== isTyping) {
      setIsTyping(newIsTyping);
      
      // Update typing status in the store
      setTypingStatus(tripId, newIsTyping);
      logger.debug('Chat Input', `User typing status changed to: ${newIsTyping ? 'typing' : 'not typing'}`);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to reset typing status after 5 seconds of inactivity
      if (newIsTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingStatus(tripId, false);
          logger.debug('Chat Input', 'User typing status reset due to inactivity');
        }, 5000);
      }
    }
  }, [isTyping, setTypingStatus, tripId]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);
    handleTypingStatus(text);
  }, [handleTypingStatus]);

  // Handle send
  const handleSend = useCallback(async () => {
    logger.info('Chat Input', 'Send button pressed');
    
    if (message.trim() === '' || isSending) {
      logger.debug('Chat Input', 'Send prevented: message empty or already sending');
      return;
    }
    
    const trimmedMessage = message.trim();
    
    // Only log and send if tripId is defined
    if (tripId) {
      logger.info('Chat Input', `Sending message in trip ${tripId}: "${trimmedMessage.substring(0, 20)}${trimmedMessage.length > 20 ? '...' : ''}"`);
    } else {
      logger.warn('Chat Input', 'Attempted to send message but tripId is undefined');
      return;
    }
    
    setMessage('');
    Keyboard.dismiss();
    
    // Reset typing status
    setIsTyping(false);
    setTypingStatus(tripId, false);
    
    try {
      // Send message directly using the chat store
      await sendMessage({ tripId, content: trimmedMessage });
      logger.debug('Chat Input', 'Message sent successfully');
    } catch (error) {
      logger.error('Chat Input', 'Error sending message:', error);
    }
  }, [message, isSending, tripId, sendMessage, setTypingStatus]);

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={message}
        onChangeText={handleTextChange}
        placeholder="Type a message..."
        placeholderTextColor={theme.colors.content.tertiary}
        multiline
        maxLength={1000}
        returnKeyType="default"
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (message.trim() === '' || isSending) && styles.disabledSendButton
        ]}
        onPress={handleSend}
        disabled={message.trim() === '' || isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Send size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}; 