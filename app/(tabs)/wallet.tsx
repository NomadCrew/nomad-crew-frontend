import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { DocumentList } from '@/src/features/wallet/components/DocumentList';
import { DocumentUploadSheet } from '@/src/features/wallet/components/DocumentUploadSheet';
import { useWalletStore } from '@/src/features/wallet/store';
import { WalletDocument } from '@/src/features/wallet/types';
import { walletApi } from '@/src/features/wallet/api';
import { logger } from '@/src/utils/logger';
import { API_CONFIG } from '@/src/api/env';
import { API_PATHS } from '@/src/utils/api-paths';
import * as WebBrowser from 'expo-web-browser';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const [showUpload, setShowUpload] = useState(false);

  const { personalDocuments, personalLoading, fetchPersonalDocuments, deleteDocument } =
    useWalletStore();

  useEffect(() => {
    fetchPersonalDocuments();
  }, []);

  const handleDocumentPress = useCallback(async (doc: WalletDocument) => {
    try {
      const docWithUrl = await walletApi.getDocument(doc.id);
      if (docWithUrl.downloadUrl) {
        const downloadUrl = `${API_CONFIG.BASE_URL}${API_PATHS.wallet.files(docWithUrl.downloadUrl)}`;
        await WebBrowser.openBrowserAsync(downloadUrl);
      }
    } catch (error) {
      logger.error('WALLET', 'Failed to open document', error);
    }
  }, []);

  const handleDocumentDelete = useCallback(
    async (doc: WalletDocument) => {
      try {
        await deleteDocument(doc.id);
      } catch (error) {
        logger.error('WALLET', 'Failed to delete document', error);
      }
    },
    [deleteDocument]
  );

  const handleRefresh = useCallback(() => {
    fetchPersonalDocuments();
  }, [fetchPersonalDocuments]);

  const handleUploadComplete = useCallback(
    (_doc: WalletDocument) => {
      fetchPersonalDocuments();
    },
    [fetchPersonalDocuments]
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Wallet</ThemedText>
      </ThemedView>

      <DocumentList
        documents={personalDocuments}
        loading={personalLoading}
        onDocumentPress={handleDocumentPress}
        onDocumentDelete={handleDocumentDelete}
        onRefresh={handleRefresh}
        emptyMessage="No documents yet"
      />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary.main, bottom: insets.bottom + 16 },
        ]}
        color="#FFFFFF"
        onPress={() => setShowUpload(true)}
      />

      <DocumentUploadSheet
        visible={showUpload}
        onDismiss={() => setShowUpload(false)}
        walletType="personal"
        onUploadComplete={handleUploadComplete}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  fab: { position: 'absolute', right: 16, borderRadius: 28 },
});
