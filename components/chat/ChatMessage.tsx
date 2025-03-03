import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
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
  
  // Validate message data before rendering
  if (!messageWithStatus?.message) {
    logger.warn('UI', 'Invalid message data');
    return null;
  }
  
  const { message, status } = messageWithStatus;
  const isCurrentUser = user?.id === message.sender?.id;
  
  // Get user display name
  const getUserDisplayName = useCallback(() => {
    return message.sender?.name || 'Unknown User';
  }, [message.sender?.name]);
  
  // Get user initial for avatar
  const getUserInitial = useCallback(() => {
    const name = message.sender?.name || '';
    return name.charAt(0).toUpperCase();
  }, [message.sender?.name]);
  
  // Format timestamp
  const formattedTime = message.created_at 
    ? formatRelativeTime(new Date(message.created_at)) 
    : 'Just now';
  
  // Status text
  const statusText = isCurrentUser 
    ? status === 'sending' ? 'Sending...' 
    : status === 'sent' ? 'Sent' 
    : status === 'error' ? 'Failed' 
    : '' 
    : '';
  
  return (
    <View style={[
      styles(theme).container,
      isCurrentUser ? styles(theme).currentUserContainer : styles(theme).otherUserContainer
    ]}>
      {/* Group avatar and message for non-current users */}
      <View style={styles(theme).messageRow}>
        {/* Avatar (only for other users) */}
        {!isCurrentUser && showAvatar && (
          <View style={styles(theme).avatarWrapper}>
            {message.sender?.avatar ? (
              <Image 
                source={{ uri: message.sender.avatar }} 
                style={styles(theme).avatar} 
                onError={() => logger.warn('UI', `Failed to load avatar`)}
              />
            ) : (
              <View style={styles(theme).avatarPlaceholder}>
                <Text style={styles(theme).avatarInitial}>{getUserInitial()}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Message content */}
        <Pressable style={[
          styles(theme).bubble,
          isCurrentUser ? styles(theme).currentUserBubble : styles(theme).otherUserBubble
        ]}>
          {/* Sender name (only for other users) */}
          {!isCurrentUser && (
            <Text style={styles(theme).senderName} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
          )}
          
          {/* Message text */}
          <Text style={[
            styles(theme).messageText,
            isCurrentUser ? styles(theme).currentUserText : styles(theme).otherUserText
          ]}>
            {message.content}
          </Text>
        </Pressable>
        
        {/* Spacer for current user (to align with avatar) */}
        {isCurrentUser && showAvatar && <View style={styles(theme).avatarSpacer} />}
      </View>
      
      {/* Timestamp and status row */}
      <View style={[
        styles(theme).metaRow,
        isCurrentUser ? styles(theme).currentUserMetaRow : styles(theme).otherUserMetaRow
      ]}>
        <Text style={[
          styles(theme).metaText,
          isCurrentUser ? styles(theme).currentUserMetaText : styles(theme).otherUserMetaText
        ]}>
          {formattedTime}{statusText ? ` · ${statusText}` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 8,
    maxWidth: '100%',
  },
  currentUserContainer: {
    alignItems: 'flex-end',
  },
  otherUserContainer: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  avatarWrapper: {
    marginRight: 8,
    height: 28,
    width: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  avatar: {
    height: 28,
    width: 28,
  },
  avatarPlaceholder: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: theme.colors.chat?.userBubble?.background || theme.colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.chat?.otherBubble?.background || theme.colors.background.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.chat?.otherBubble?.sender || theme.colors.content.secondary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: theme.colors.chat?.userBubble?.text || '#FFFFFF',
  },
  otherUserText: {
    color: theme.colors.chat?.otherBubble?.text || theme.colors.content.primary,
  },
  metaRow: {
    marginTop: 4,
    paddingHorizontal: 4,
    maxWidth: '85%',
  },
  currentUserMetaRow: {
    alignItems: 'flex-end',
  },
  otherUserMetaRow: {
    alignItems: 'flex-start',
    marginLeft: 36, // Align with the message bubble, not the avatar
  },
  metaText: {
    fontSize: 10,
    opacity: 0.7,
  },
  currentUserMetaText: {
    color: theme.colors.chat?.userBubble?.meta || theme.colors.content.tertiary,
  },
  otherUserMetaText: {
    color: theme.colors.chat?.otherBubble?.meta || theme.colors.content.tertiary,
  },
  avatarSpacer: {
    width: 28,
    marginLeft: 8,
  },
}); 