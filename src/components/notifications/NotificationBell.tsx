import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { NotificationBadge } from './NotificationBadge';
import { router } from 'expo-router';

interface NotificationBellProps {
  color?: string;
  size?: number;
  onPress?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  color,
  size = 24,
  onPress,
}) => {
  const theme = useTheme();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: navigate to the notifications screen
      router.push('/notifications');
    }
  };
  
  return (
    <View style={styles.container}>
      <IconButton
        icon="bell"
        size={size}
        iconColor={color || theme.colors.onSurface}
        onPress={handlePress}
      />
      <NotificationBadge />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
}); 