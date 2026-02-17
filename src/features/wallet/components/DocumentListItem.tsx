// src/features/wallet/components/DocumentListItem.tsx
// Minimal flat row for wallet document lists

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument } from '../types';
import { getDocumentTypeIcon, getDocumentContextLine } from '../utils';
import { getCachedThumbnailUri } from '../services';

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
  const thumbnailUri = useMemo(() => getCachedThumbnailUri(document.id), [document.id]);

  const handlePress = useCallback(() => onPress(document), [document, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.colors.background.default },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.iconBox}>
        <Icon size={24} color={theme.colors.text.secondary} />
      </View>
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
      {thumbnailUri ? (
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} resizeMode="cover" />
        </View>
      ) : (
        <ChevronRight size={20} color={theme.colors.text.tertiary} />
      )}
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
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
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
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 1.5,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 68,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
