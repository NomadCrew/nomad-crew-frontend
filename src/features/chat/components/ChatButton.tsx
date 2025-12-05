import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useChatStore } from '../store';
import { Theme } from '@/src/theme/types';

interface ChatButtonProps {
  tripId: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ tripId, onPress, style }) => {
  const { theme } = useAppTheme();
  const { messagesByTripId } = useChatStore();

  // Calculate total unread messages for this trip
  // This is a placeholder - actual implementation would depend on read receipts
  const messages = messagesByTripId[tripId] || [];
  const unreadCount = messages.length > 0 ? 1 : 0;

  return (
    <TouchableOpacity
      style={[styles(theme).container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
      <Text style={styles(theme).text}>Chat</Text>

      {unreadCount > 0 && (
        <View style={styles(theme).badge}>
          <Text style={styles(theme).badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary.main,
      paddingVertical: theme.spacing.stack.sm,
      paddingHorizontal: theme.spacing.stack.md,
      borderRadius: theme.borderRadius.md,
      position: 'relative',
    },
    text: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: theme.typography.size.md,
      marginLeft: theme.spacing.stack.xs,
    },
    badge: {
      position: 'absolute',
      top: -8,
      right: -8,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.status.error.content,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: theme.typography.size.xs,
      fontWeight: 'bold',
    },
  });
