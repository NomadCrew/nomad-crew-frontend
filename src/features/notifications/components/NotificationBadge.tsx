import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';
import { useNotificationStore } from '../store/useNotificationStore';

interface NotificationBadgeProps {
  size?: number;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 20,
  maxCount = 99,
}) => {
  const theme = useTheme();
  const { unreadCount } = useNotificationStore();
  
  if (unreadCount === 0) {
    return null;
  }
  
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  
  return (
    <Badge
      size={size}
      style={[
        styles.badge,
        { backgroundColor: theme.colors.error }
      ]}
    >
      {displayCount}
    </Badge>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
}); 