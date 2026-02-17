import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import {
  DocumentUploadSheet,
  SwipeableDocumentItem,
  DocumentViewer,
  EditDocumentSheet,
} from '@/src/features/wallet/components';
import { useWalletStore } from '@/src/features/wallet/store';
import { WalletDocument } from '@/src/features/wallet/types';
import { groupDocumentsByType, DocumentSection } from '@/src/features/wallet/utils';
import { loadThumbnailCache } from '@/src/features/wallet/services';
import { logger } from '@/src/utils/logger';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<WalletDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<WalletDocument | null>(null);

  const { personalDocuments, personalLoading, fetchPersonalDocuments, deleteDocument } =
    useWalletStore();

  useEffect(() => {
    fetchPersonalDocuments();
    loadThumbnailCache();
  }, []);

  const sections = useMemo(() => groupDocumentsByType(personalDocuments), [personalDocuments]);

  const handleDocumentPress = useCallback((doc: WalletDocument) => {
    setViewingDocument(doc);
  }, []);

  const handleDocumentDelete = useCallback(
    (doc: WalletDocument) => {
      Alert.alert('Delete Document', `Are you sure you want to delete "${doc.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(doc.id);
            } catch (error) {
              logger.error('WALLET', 'Failed to delete document', error);
            }
          },
        },
      ]);
    },
    [deleteDocument]
  );

  const handleRefresh = useCallback(() => {
    fetchPersonalDocuments();
  }, [fetchPersonalDocuments]);

  const handleUploadComplete = useCallback(
    (doc: WalletDocument) => {
      fetchPersonalDocuments();
      setEditingDocument(doc);
    },
    [fetchPersonalDocuments]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DocumentSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>
          {section.label.toUpperCase()}
        </Text>
      </View>
    ),
    [theme.colors.text.tertiary]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
          Your wallet's feeling light
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.text.tertiary }]}>
          Passports, bookings, receipts — everything you need, minus the panic at the airport.
        </Text>
      </View>
    ),
    [theme.colors.text.secondary, theme.colors.text.tertiary]
  );

  if (personalLoading && personalDocuments.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedView style={styles.header}>
          <ThemedText variant="display.medium">Wallet</ThemedText>
        </ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Wallet</ThemedText>
      </ThemedView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index, section }) => (
          <SwipeableDocumentItem
            document={item}
            onPress={handleDocumentPress}
            onDelete={handleDocumentDelete}
            showSeparator={index < section.data.length - 1}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={personalLoading ? null : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={personalLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
            colors={[theme.colors.primary.main]}
          />
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={!sections.length && !personalLoading ? { flex: 1 } : undefined}
      />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.text.primary, bottom: insets.bottom + 16 },
        ]}
        color={theme.colors.background.default}
        onPress={() => setShowUpload(true)}
      />

      <DocumentUploadSheet
        visible={showUpload}
        onDismiss={() => setShowUpload(false)}
        walletType="personal"
        onUploadComplete={handleUploadComplete}
      />

      <DocumentViewer
        visible={!!viewingDocument}
        onDismiss={() => setViewingDocument(null)}
        document={viewingDocument}
        onEdit={(doc) => {
          setViewingDocument(null);
          setEditingDocument(doc);
        }}
      />

      <EditDocumentSheet
        visible={!!editingDocument}
        onDismiss={() => setEditingDocument(null)}
        document={editingDocument}
        onUpdated={() => fetchPersonalDocuments()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  fab: { position: 'absolute', right: 16, borderRadius: 28 },
});
