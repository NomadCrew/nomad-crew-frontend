import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '@/src/store/useChatStore';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { Theme } from '@/src/theme/types';
import { Ionicons } from '@expo/vector-icons';
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
  const { groups, fetchChatGroups } = useChatStore();
  
  // Use our new useThemedStyles hook
  const styles = useThemedStyles((theme) => {
    // Safely access theme properties with fallbacks
    const primaryColor = theme?.colors?.primary?.main || '#F46315';
    const textPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const textSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const textTertiary = theme?.colors?.content?.tertiary || '#9CA3AF';
    const surfaceDefault = theme?.colors?.surface?.default || '#FFFFFF';
    const borderDefault = theme?.colors?.border?.default || '#E5E7EB';
    const errorContent = theme?.colors?.status?.error?.content || '#DC2626';
    
    const typographySizeXs = theme?.typography?.size?.xs || 12;
    const typographySizeSm = theme?.typography?.size?.sm || 14;
    const typographySizeLg = theme?.typography?.size?.lg || 18;
    
    const borderRadiusMd = theme?.borderRadius?.md || 8;
    
    const spacingStackXs = theme?.spacing?.stack?.xs || 8;
    const spacingStackSm = theme?.spacing?.stack?.sm || 12;
    const spacingStackMd = theme?.spacing?.stack?.md || 16;
    
    return {
      container: {
        flex: 1,
        backgroundColor: surfaceDefault,
        borderRadius: borderRadiusMd,
        padding: spacingStackMd,
      },
      minimizedContainer: {
        padding: spacingStackSm,
        position: 'relative',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacingStackSm,
      },
      titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      title: {
        fontSize: typographySizeLg,
        fontWeight: 'bold',
        color: textPrimary,
        marginLeft: spacingStackXs,
      },
      badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: errorContent,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
      },
      minimizedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: errorContent,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
      },
      badgeText: {
        color: '#FFFFFF',
        fontSize: typographySizeXs,
        fontWeight: 'bold',
      },
      content: {
        flex: 1,
        marginBottom: spacingStackMd,
      },
      minimizedContent: {
        marginBottom: 0,
      },
      messageContainer: {
        marginBottom: spacingStackXs,
      },
      sender: {
        fontSize: typographySizeSm,
        fontWeight: 'bold',
        color: textPrimary,
        marginBottom: 2,
      },
      message: {
        fontSize: typographySizeSm,
        color: textSecondary,
      },
      time: {
        fontSize: typographySizeXs,
        color: textTertiary,
        alignSelf: 'flex-end',
      },
      emptyText: {
        fontSize: typographySizeSm,
        color: textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
      },
      footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: borderDefault,
        paddingTop: spacingStackSm,
      },
      groupCount: {
        fontSize: typographySizeXs,
        color: textTertiary,
      },
      viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      viewButtonText: {
        fontSize: typographySizeSm,
        color: primaryColor,
        fontWeight: 'bold',
        marginRight: 4,
      },
    };
  });
  
  // Safely access theme colors with fallbacks
  const primaryColor = theme?.colors?.primary?.main || '#F46315'; // Fallback to orange
  
  // Fetch chat groups on mount with the tripId
  useEffect(() => {
    if (tripId) {
      fetchChatGroups(tripId);
    }
  }, [fetchChatGroups, tripId]);
  
  // Filter groups by tripId and find the default group
  const tripGroups = groups?.filter(group => group.tripId === tripId) || [];
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
      
      {!minimized && (
        <View style={styles.footer}>
          <Text style={styles.groupCount}>
            {tripGroups.length} {tripGroups.length === 1 ? 'chat' : 'chats'}
          </Text>
          
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={onPress}
          >
            <Text style={styles.viewButtonText}>
              View All
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={primaryColor} 
            />
          </TouchableOpacity>
        </View>
      )}
      
      {unreadCount > 0 && minimized && (
        <View style={styles.minimizedBadge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}; 