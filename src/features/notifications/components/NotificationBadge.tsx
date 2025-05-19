import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useNotificationStore } from '../store/useNotificationStore';

interface NotificationBadgeProps {
  size?: number;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 20,
  maxCount = 99,
}) => {
  const theme = useAppTheme().theme;
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