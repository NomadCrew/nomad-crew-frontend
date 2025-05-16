import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/features/chat';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { MessageSquare } from 'lucide-react-native';
import { useThemedStyles } from '@/src/theme/utils';

interface ChatCardProps {
  tripId: string;
  onPress: () => void;
  minimized?: boolean;
}

export const ChatCard: React.FC<ChatCardProps> = ({ 
  tripId, 
  onPress,
  minimized = false
}) => {
  const { theme } = useTheme();
  const { messagesByTripId } = useChatStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<{
    content: string;
    sender: { name: string };
    created_at: string;
  } | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState('');
  
  // Get theme colors
  const primaryColor = theme.colors.primary.main;
  const backgroundColor = theme.colors.background.surface;
  const textColor = theme.colors.content.primary;
  const secondaryTextColor = theme.colors.content.secondary;
  const tertiaryTextColor = theme.colors.content.tertiary;
  
  // Get styles using themed styles hook
  const styles = useThemedStyles((theme) => {
    return StyleSheet.create({
      container: {
        backgroundColor: backgroundColor,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.stack.md,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
      },
      minimizedContainer: {
        marginBottom: theme.spacing.stack.sm,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.stack.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.default,
      },
      titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      title: {
        fontSize: theme.typography.size.md,
        fontWeight: 'bold',
        color: textColor,
        marginLeft: theme.spacing.stack.xs,
      },
      badge: {
        backgroundColor: primaryColor,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
      },
      badgeText: {
        color: '#FFFFFF',
        fontSize: theme.typography.size.xs,
        fontWeight: 'bold',
      },
      content: {
        padding: theme.spacing.stack.sm,
      },
      minimizedContent: {
        padding: theme.spacing.stack.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      messageContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      sender: {
        fontWeight: 'bold',
        color: textColor,
        marginRight: 4,
      },
      message: {
        color: secondaryTextColor,
        flex: 1,
      },
      time: {
        fontSize: theme.typography.size.xs,
        color: tertiaryTextColor,
        marginTop: minimized ? 0 : theme.spacing.stack.xs,
        marginLeft: minimized ? theme.spacing.stack.xs : 0,
      },
      emptyText: {
        color: secondaryTextColor,
        fontStyle: 'italic',
      },
    });
  });
  
  // Update last message and unread count when messages change
  useEffect(() => {
    const messages = messagesByTripId[tripId] || [];
    
    // Set last message
    if (messages.length > 0) {
      const lastMsg = messages[0];
      setLastMessage({
        content: lastMsg.message.content,
        sender: {
          name: lastMsg.message.sender.name
        },
        created_at: lastMsg.message.created_at
      });
      
      // Format relative time
      setLastMessageTime(formatRelativeTime(new Date(lastMsg.message.created_at)));
    } else {
      setLastMessage(null);
      setLastMessageTime('');
    }
    
    // Calculate unread count (this is a placeholder - actual implementation would depend on read receipts)
    // For now, we'll just show a badge if there are any messages
    setUnreadCount(messages.length > 0 ? 1 : 0);
  }, [messagesByTripId, tripId]);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.container,
        minimized && styles.minimizedContainer
      ]}>
        {!minimized && (
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageSquare 
                size={20} 
                color={primaryColor} 
              />
              <Text style={styles.title}>
                Trip Chat
              </Text>
            </View>
            
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.content,
          minimized && styles.minimizedContent
        ]}>
          {lastMessage ? (
            <>
              <View style={styles.messageContainer}>
                <Text style={styles.sender} numberOfLines={1}>
                  {lastMessage.sender.name}:
                </Text>
                <Text 
                  style={styles.message}
                  numberOfLines={minimized ? 1 : 2}
                >
                  {lastMessage.content}
                </Text>
              </View>
              
              <Text style={styles.time}>
                {lastMessageTime}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}; 