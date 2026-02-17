// src/features/wallet/components/DocumentListItem.tsx
// Minimal flat row for wallet document lists

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument } from '../types';
import { getDocumentTypeIcon, getDocumentContextLine } from '../utils';

interface DocumentListItemProps {
  document: WalletDocument;
  onPress: (document: WalletDocument) => void;
  onDelete?: (document: WalletDocument) => void;
  showSeparator?: boolean;
}

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  onPress,
  showSeparator = true,
}) => {
  const { theme } = useAppTheme();
  const Icon = useMemo(() => getDocumentTypeIcon(document.documentType), [document.documentType]);
  const contextLine = useMemo(() => getDocumentContextLine(document), [document]);

  const handlePress = useCallback(() => onPress(document), [document, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
    >
      <Icon size={24} color={theme.colors.text.secondary} />
      <View style={styles.content}>
        <Text
          style={[styles.name, { color: theme.colors.text.primary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {document.name}
        </Text>
        <Text style={[styles.context, { color: theme.colors.text.tertiary }]}>{contextLine}</Text>
      </View>
      <ChevronRight size={20} color={theme.colors.text.tertiary} />
      {showSeparator && (
        <View style={[styles.separator, { backgroundColor: theme.colors.border.default }]} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  context: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 56,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
