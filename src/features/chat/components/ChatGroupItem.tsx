import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ChatGroup } from '@/src/features/chat';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { Theme } from '@/src/theme/types';
import { Ionicons } from '@expo/vector-icons';

interface ChatGroupItemProps {
  group: ChatGroup;
  onPress: (groupId: string) => void;
  isSelected?: boolean;
}

export const ChatGroupItem: React.FC<ChatGroupItemProps> = ({
  group,
  onPress,
  isSelected = false
}) => {
  const { theme } = useTheme();
  
  const handlePress = () => {
    onPress(group.id);
  };
  
  // Format the last message time
  const lastMessageTime = group.lastMessageAt 
    ? formatRelativeTime(new Date(group.lastMessageAt))
    : '';
  
  // Get the last message preview
  const lastMessagePreview = group.lastMessage?.content 
    ? group.lastMessage.content.length > 30
      ? `${group.lastMessage.content.substring(0, 30)}...`
      : group.lastMessage.content
    : 'No messages yet';
  
  // Get the sender name for the last message
  const lastMessageSender = group.lastMessage?.sender?.name || '';
  
  return (
    <TouchableOpacity
      style={[
        styles(theme).container,
        isSelected && styles(theme).selectedContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles(theme).content}>
        <View style={styles(theme).iconContainer}>
          <Ionicons 
            name={group.isDefault ? "chatbubbles" : "chatbubbles-outline"} 
            size={24} 
            color={theme.colors.primary.default} 
          />
        </View>
        
        <View style={styles(theme).textContainer}>
          <View style={styles(theme).headerRow}>
            <Text 
              style={styles(theme).groupName}
              numberOfLines={1}
            >
              {group.name}
            </Text>
            
            {lastMessageTime && (
              <Text style={styles(theme).timeText}>
                {lastMessageTime}
              </Text>
            )}
          </View>
          
          <View style={styles(theme).messageRow}>
            <Text 
              style={styles(theme).messagePreview}
              numberOfLines={1}
            >
              {lastMessageSender ? `${lastMessageSender}: ` : ''}
              {lastMessagePreview}
            </Text>
            
            {(group.unreadCount && group.unreadCount > 0) ? (
              <View style={styles(theme).unreadBadge}>
                <Text style={styles(theme).unreadText}>
                  {group.unreadCount > 99 ? '99+' : group.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.stack.sm,
    paddingHorizontal: theme.spacing.layout.section.padding,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  selectedContainer: {
    backgroundColor: theme.colors.background.selected,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.stack.sm,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.stack.xxs,
  },
  groupName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.stack.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.tertiary,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    marginRight: theme.spacing.stack.xs,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: 'bold',
    color: theme.colors.text.onPrimary,
  },
}); 