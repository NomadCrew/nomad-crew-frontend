// src/features/wallet/components/SwipeableDocumentItem.tsx

import React, { useRef, useCallback } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument } from '../types';
import { DocumentListItem } from './DocumentListItem';

const ACTION_WIDTH = 80;

interface SwipeableDocumentItemProps {
  document: WalletDocument;
  onPress: (document: WalletDocument) => void;
  onDelete: (document: WalletDocument) => void;
  showSeparator?: boolean;
}

interface ActionProps {
  progress: SharedValue<number>;
  onPress: () => void;
  backgroundColor: string;
}

const RightAction: React.FC<ActionProps> = ({ progress, onPress, backgroundColor }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    return { transform: [{ scale }], opacity };
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

export const SwipeableDocumentItem: React.FC<SwipeableDocumentItemProps> = ({
  document,
  onPress,
  onDelete,
  showSeparator = true,
}) => {
  const theme = useAppTheme().theme;
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(document);
  }, [document, onDelete]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, _dragX: SharedValue<number>) => (
      <RightAction
        progress={progress}
        onPress={handleDelete}
        backgroundColor={theme.colors.status.error.content}
      />
    ),
    [handleDelete, theme.colors.status.error.content]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.colors.background.default }}
      childrenContainerStyle={{ backgroundColor: theme.colors.background.default }}
    >
      <DocumentListItem document={document} onPress={onPress} showSeparator={showSeparator} />
    </ReanimatedSwipeable>
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
