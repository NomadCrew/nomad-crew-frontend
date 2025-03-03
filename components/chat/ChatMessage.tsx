import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ChatMessageWithStatus } from '@/src/types/chat';
import { useAuthStore } from '@/src/store/useAuthStore';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { Theme } from '@/src/theme/types';
import { logger } from '@/src/utils/logger';

interface ChatMessageProps {
  messageWithStatus: ChatMessageWithStatus;
  showAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  messageWithStatus, 
  showAvatar = true 
}) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  
  // Log when the message component renders
  useEffect(() => {
    if (messageWithStatus?.message?.id) {
      logger.debug(
        'UI', 
        `Rendering message ${messageWithStatus.message.id.substring(0, 8)}... ` +
        `from ${messageWithStatus.message.sender?.name || 'Unknown'}, ` +
        `content: "${messageWithStatus.message.content?.substring(0, 20)}${messageWithStatus.message.content?.length > 20 ? '...' : ''}", ` +
        `status: ${messageWithStatus.status}`
      );
    }
  }, [messageWithStatus]);
  
  // Validate message data before rendering
  if (!messageWithStatus || !messageWithStatus.message) {
    logger.warn('UI', 'Invalid message data:', JSON.stringify(messageWithStatus, null, 2));
    return null;
  }
  
  const { message, status } = messageWithStatus;
  
  // Additional validation for message content
  if (!message.content) {
    logger.warn('UI', `Message ${message.id} has no content`);
  }
  
  // Check for created_at field
  if (!message.created_at) {
    logger.warn('UI', `Message ${message.id} has no timestamp (created_at)`);
  }
  
  const isCurrentUser = user?.id === message.sender.id;
  
  // Get user display name
  const getUserDisplayName = useCallback(() => {
    return message.sender.name || 'Unknown User';
  }, [message.sender.name]);
  
  // Get user initial for avatar
  const getUserInitial = useCallback(() => {
    const name = message.sender.name || '';
    return name.charAt(0).toUpperCase();
  }, [message.sender.name]);
  
  // Log message status for debugging
  useEffect(() => {
    if (message.id) {
      logger.debug(
        'UI', 
        `Message ${message.id.substring(0, 8)}... status: ${status}`
      );
    }
  }, [message.id, status]);
  
  return (
    <View style={[
      styles(theme).messageContainer,
      isCurrentUser ? styles(theme).currentUserContainer : styles(theme).otherUserContainer
    ]}>
      {/* Avatar (only for other users) */}
      {!isCurrentUser && showAvatar && (
        <View style={styles(theme).avatarContainer}>
          {message.sender.avatar ? (
            <Image 
              source={{ uri: message.sender.avatar }} 
              style={styles(theme).avatar} 
              onError={() => {
                logger.warn('UI', `Failed to load avatar for user ${message.sender.id}`);
              }}
            />
          ) : (
            <View style={styles(theme).avatarPlaceholder}>
              <Text style={styles(theme).avatarInitial}>{getUserInitial()}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Message content */}
      <View style={[
        styles(theme).bubble,
        isCurrentUser ? styles(theme).currentUserBubble : styles(theme).otherUserBubble
      ]}>
        {/* Sender name (only for other users) */}
        {!isCurrentUser && (
          <Text style={styles(theme).senderName}>{getUserDisplayName()}</Text>
        )}
        
        {/* Message text */}
        <Text style={styles(theme).messageText}>{message.content}</Text>
        
        {/* Timestamp and status */}
        <View style={styles(theme).metaContainer}>
          <Text style={styles(theme).timestamp}>
            {message.created_at ? formatRelativeTime(new Date(message.created_at)) : 'Just now'}
          </Text>
          
          {/* Status indicator for current user's messages */}
          {isCurrentUser && (
            <Text style={[
              styles(theme).status,
              status === 'error' && styles(theme).errorStatus
            ]}>
              {status === 'sending' ? 'Sending...' : 
               status === 'sent' ? 'Sent' : 
               status === 'error' ? 'Failed' : ''}
            </Text>
          )}
        </View>
      </View>
      
      {/* Spacer for current user (to align with avatar) */}
      {isCurrentUser && showAvatar && (
        <View style={styles(theme).avatarSpacer} />
      )}
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.background.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.content.secondary,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.content.primary,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    color: theme.colors.content.tertiary,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  status: {
    fontSize: 10,
    color: theme.colors.content.tertiary,
  },
  avatarSpacer: {
    width: 32,
    marginLeft: 8,
  },
  errorStatus: {
    color: '#FF3B30',
  },
}); 