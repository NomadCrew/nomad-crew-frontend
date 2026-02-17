// src/features/wallet/components/DocumentList.tsx
// Document list component using FlashList for performance

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument } from '../types';
import { DocumentListItem } from './DocumentListItem';

interface DocumentListProps {
  documents: WalletDocument[];
  loading?: boolean;
  onDocumentPress: (document: WalletDocument) => void;
  onDocumentDelete?: (document: WalletDocument) => void;
  onRefresh?: () => void;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
}

/**
 * Document list component with FlashList for optimal performance
 * Supports pull-to-refresh, loading state, and empty state
 */
export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading = false,
  onDocumentPress,
  onDocumentDelete,
  onRefresh,
  emptyMessage = 'No documents yet',
  ListHeaderComponent,
}) => {
  const { theme } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background.default,
        },
        listContent: {
          paddingVertical: 8,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
        },
        emptyIcon: {
          marginBottom: 16,
          opacity: 0.5,
        },
        emptyText: {
          fontSize: 16,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        },
        emptySubText: {
          fontSize: 14,
          color: theme.colors.text.tertiary,
          textAlign: 'center',
          marginTop: 8,
        },
      }),
    [theme]
  );

  const renderItem = useCallback(
    ({ item }: { item: WalletDocument }) => (
      <DocumentListItem document={item} onPress={onDocumentPress} onDelete={onDocumentDelete} />
    ),
    [onDocumentPress, onDocumentDelete]
  );

  const keyExtractor = useCallback((item: WalletDocument) => item.id, []);

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubText}>Tap the + button to add your first document</Text>
      </View>
    );
  }, [loading, emptyMessage, styles]);

  // Show loading indicator for initial load
  if (loading && documents.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={documents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.main}
              colors={[theme.colors.primary.main]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
