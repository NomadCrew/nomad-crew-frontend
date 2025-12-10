import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { Trash2, Check } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Notification } from '../types/notification';
import { useNotificationStore } from '../store/useNotificationStore';

const ACTION_WIDTH = 80;

interface SwipeableNotificationItemProps {
  notification: Notification;
  children: React.ReactNode;
  onDelete?: () => void;
  onMarkRead?: () => void;
}

/**
 * Wrapper component that adds swipe actions to any notification item.
 * - Swipe left: Delete (red background, trash icon)
 * - Swipe right: Mark as read (blue background, checkmark icon)
 */
export const SwipeableNotificationItem: React.FC<SwipeableNotificationItemProps> = ({
  notification,
  children,
  onDelete,
  onMarkRead,
}) => {
  const theme = useAppTheme().theme;
  const swipeableRef = useRef<SwipeableMethods>(null);
  const { deleteNotification, markNotificationRead } = useNotificationStore();

  const handleDelete = useCallback(async () => {
    swipeableRef.current?.close();
    if (onDelete) {
      onDelete();
    } else {
      await deleteNotification(notification.id);
    }
  }, [notification.id, deleteNotification, onDelete]);

  const handleMarkRead = useCallback(async () => {
    swipeableRef.current?.close();
    if (onMarkRead) {
      onMarkRead();
    } else if (!notification.read) {
      await markNotificationRead(notification.id);
    }
  }, [notification.id, notification.read, markNotificationRead, onMarkRead]);

  // Render right action (Delete) - appears when swiping left
  const renderRightActions = useCallback(
    (progress: SharedValue<number>, dragX: SharedValue<number>) => {
      return (
        <RightAction
          progress={progress}
          dragX={dragX}
          onPress={handleDelete}
          backgroundColor={theme.colors.status.error.content}
        />
      );
    },
    [handleDelete, theme.colors.status.error.content]
  );

  // Render left action (Mark as read) - appears when swiping right
  const renderLeftActions = useCallback(
    (progress: SharedValue<number>, dragX: SharedValue<number>) => {
      // Don't show mark as read if already read
      if (notification.read) return null;

      return (
        <LeftAction
          progress={progress}
          dragX={dragX}
          onPress={handleMarkRead}
          backgroundColor={theme.colors.primary.main}
        />
      );
    },
    [handleMarkRead, notification.read, theme.colors.primary.main]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </ReanimatedSwipeable>
  );
};

// Right action component (Delete)
interface ActionProps {
  progress: SharedValue<number>;
  dragX: SharedValue<number>;
  onPress: () => void;
  backgroundColor: string;
}

const RightAction: React.FC<ActionProps> = ({ progress, onPress, backgroundColor }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Pressable onPress={onPress} style={[styles.actionContainer, { backgroundColor }]}>
      <Reanimated.View style={[styles.actionContent, animatedStyle]}>
        <Trash2 size={24} color="white" />
        <Text style={styles.actionText}>Delete</Text>
      </Reanimated.View>
    </Pressable>
  );
};

// Left action component (Mark as read)
const LeftAction: React.FC<ActionProps> = ({ progress, onPress, backgroundColor }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Pressable onPress={onPress} style={[styles.actionContainer, { backgroundColor }]}>
      <Reanimated.View style={[styles.actionContent, animatedStyle]}>
        <Check size={24} color="white" />
        <Text style={styles.actionText}>Read</Text>
      </Reanimated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
