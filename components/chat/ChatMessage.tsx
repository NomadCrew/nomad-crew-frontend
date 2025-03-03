import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ChatMessage as ChatMessageType } from '@/src/types/chat';
import { useAuthStore } from '@/src/store/useAuthStore';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { Theme } from '@/src/theme/types';

interface ChatMessageProps {
  message: ChatMessageType;
  showAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  showAvatar = true 
}) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  
  // Add detailed logging to debug the TypeError
  console.log('ChatMessage rendering with message:', JSON.stringify({
    messageId: message?.message?.id,
    userId: message?.user?.id,
    content: message?.message?.content,
    hasMessage: !!message?.message,
    hasUser: !!message?.user
  }));
  
  if (!message?.message || !message?.user) {
    console.warn('Invalid message or missing user data:', JSON.stringify(message));
    return null;
  }
  
  const isCurrentUser = user?.id === message.user.id;
  
  return (
    <View style={[
      styles(theme).container,
      isCurrentUser ? styles(theme).currentUserContainer : styles(theme).otherUserContainer
    ]}>
      {!isCurrentUser && showAvatar && (
        <View style={styles(theme).avatarContainer}>
          {message.user.profilePicture ? (
            <Image 
              source={{ uri: message.user.profilePicture }} 
              style={styles(theme).avatar} 
            />
          ) : (
            <View style={[
              styles(theme).avatarPlaceholder,
              { backgroundColor: theme.colors.primary.main }
            ]}>
              <Text style={styles(theme).avatarInitial}>
                {message.user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={[
        styles(theme).messageContainer,
        isCurrentUser ? styles(theme).currentUserMessage : styles(theme).otherUserMessage
      ]}>
        {!isCurrentUser && (
          <Text style={styles(theme).senderName}>
            {message.user.username}
          </Text>
        )}
        
        <Text style={[
          styles(theme).messageText,
          isCurrentUser ? styles(theme).currentUserText : styles(theme).otherUserText
        ]}>
          {message.message.content}
        </Text>
        
        <Text style={styles(theme).timestamp}>
          {formatRelativeTime(new Date(message.message.created_at))}
        </Text>
        
        {isCurrentUser && message.status && (
          <View style={styles(theme).statusContainer}>
            {message.status === 'sent' && (
              <Text style={styles(theme).statusText}>Sent</Text>
            )}
            {message.status === 'delivered' && (
              <Text style={styles(theme).statusText}>Delivered</Text>
            )}
            {message.status === 'read' && (
              <Text style={[styles(theme).statusText, { color: theme.colors.status.success.content }]}>Read</Text>
            )}
            {message.status === 'failed' && (
              <Text style={[styles(theme).statusText, { color: theme.colors.status.error.content }]}>Failed</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: theme.spacing.stack.xs,
    paddingHorizontal: theme.spacing.layout.section.padding,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: theme.spacing.stack.xs,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: theme.typography.size.sm,
    fontWeight: 'bold',
  },
  messageContainer: {
    maxWidth: '70%',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.stack.sm,
    marginBottom: theme.spacing.stack.xs,
  },
  currentUserMessage: {
    backgroundColor: theme.colors.primary.main,
    borderBottomRightRadius: 0,
  },
  otherUserMessage: {
    backgroundColor: theme.colors.background.surface,
    borderBottomLeftRadius: 0,
  },
  senderName: {
    fontSize: theme.typography.size.xs,
    fontWeight: 'bold',
    marginBottom: theme.spacing.stack.xxs,
    color: theme.colors.content.secondary,
  },
  messageText: {
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeights?.normal || 1.5,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: theme.colors.content.primary,
  },
  timestamp: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.tertiary,
    alignSelf: 'flex-end',
    marginTop: theme.spacing.stack.xxs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.stack.xxs,
  },
  statusText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.tertiary,
  },
}); 