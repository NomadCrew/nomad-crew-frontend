import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator, Platform } from 'react-native';
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.default,
        backgroundColor: theme.colors.background.elevated,
      },
      inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
      },
      input: {
        flex: 1,
        color: theme.colors.content.primary,
        fontSize: 15,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
      },
      sendButton: {
        marginLeft: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
      },
      disabledSendButton: {
        backgroundColor: theme.colors.primary.disabled,
        opacity: 0.7,
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
      <View style={styles.inputContainer}>
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
      </View>
      <TouchableOpacity
        style={[
          styles.sendButton,
          (message.trim() === '' || isSending) && styles.disabledSendButton
        ]}
        onPress={handleSend}
        disabled={message.trim() === '' || isSending}
        activeOpacity={0.7}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Send size={18} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}; 