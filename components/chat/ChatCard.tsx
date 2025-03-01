import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { Theme } from '@/src/theme/types';
import { Ionicons } from '@expo/vector-icons';

interface ChatCardProps {
  tripId: string;
  onPress: () => void;
}

export const ChatCard: React.FC<ChatCardProps> = ({ tripId, onPress }) => {
  const { theme } = useTheme();
  const { groups, fetchChatGroups } = useChatStore();
  
  // Fetch chat groups on mount
  useEffect(() => {
    fetchChatGroups();
  }, [fetchChatGroups]);
  
  // Filter groups by tripId and find the default group
  const tripGroups = groups.filter(group => group.tripId === tripId);
  const defaultGroup = tripGroups.find(group => group.isDefault);
  
  // Calculate total unread messages for this trip
  const unreadCount = tripGroups.reduce((total, group) => total + (group.unreadCount || 0), 0);
  
  // Get the most recent message
  const mostRecentGroup = tripGroups.reduce((mostRecent, group) => {
    if (!mostRecent || !mostRecent.lastMessageAt) return group;
    if (!group.lastMessageAt) return mostRecent;
    
    return new Date(group.lastMessageAt) > new Date(mostRecent.lastMessageAt)
      ? group
      : mostRecent;
  }, null as any);
  
  const lastMessage = mostRecentGroup?.lastMessage;
  const lastMessageTime = mostRecentGroup?.lastMessageAt 
    ? formatRelativeTime(new Date(mostRecentGroup.lastMessageAt))
    : '';
  
  return (
    <TouchableOpacity 
      style={styles(theme).container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles(theme).header}>
        <View style={styles(theme).titleContainer}>
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={theme.colors.primary.main} 
          />
          <Text style={styles(theme).title}>
            Trip Chat
          </Text>
        </View>
        
        {unreadCount > 0 && (
          <View style={styles(theme).badge}>
            <Text style={styles(theme).badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles(theme).content}>
        {lastMessage ? (
          <>
            <View style={styles(theme).messageContainer}>
              <Text style={styles(theme).sender}>
                {lastMessage.sender.name}:
              </Text>
              <Text 
                style={styles(theme).message}
                numberOfLines={2}
              >
                {lastMessage.content}
              </Text>
            </View>
            
            <Text style={styles(theme).time}>
              {lastMessageTime}
            </Text>
          </>
        ) : (
          <Text style={styles(theme).emptyText}>
            No messages yet. Start the conversation!
          </Text>
        )}
      </View>
      
      <View style={styles(theme).footer}>
        <Text style={styles(theme).groupCount}>
          {tripGroups.length} {tripGroups.length === 1 ? 'chat' : 'chats'}
        </Text>
        
        <TouchableOpacity 
          style={styles(theme).viewButton}
          onPress={onPress}
        >
          <Text style={styles(theme).viewButtonText}>
            View All
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.primary.main} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.stack.md,
    shadowColor: theme.colors.shadow || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.stack.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
    marginLeft: theme.spacing.stack.xs,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.status.error.content,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.primary.onPrimary,
    fontSize: theme.typography.size.xs,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: theme.spacing.stack.md,
    minHeight: 50,
  },
  messageContainer: {
    marginBottom: theme.spacing.stack.xs,
  },
  sender: {
    fontSize: theme.typography.size.sm,
    fontWeight: 'bold',
    color: theme.colors.content.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.content.secondary,
  },
  time: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.tertiary,
    alignSelf: 'flex-end',
  },
  emptyText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.content.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    paddingTop: theme.spacing.stack.sm,
  },
  groupCount: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.content.tertiary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary.main,
    fontWeight: 'bold',
    marginRight: 4,
  },
}); 