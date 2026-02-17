import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { X, MoreVertical, AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { walletApi } from '../api';
import { API_CONFIG } from '@/src/api/env';
import { API_PATHS } from '@/src/utils/api-paths';
import { getSupabaseJWT } from '@/src/api/api-client';
import type { WalletDocument } from '../types';
import { logger } from '@/src/utils/logger';

type ViewerState = 'loading' | 'viewing' | 'error';

interface DocumentViewerProps {
  visible: boolean;
  onDismiss: () => void;
  document: WalletDocument | null;
  onEdit?: (document: WalletDocument) => void;
}

const CACHE_DIR = `${FileSystem.cacheDirectory}wallet-view/`;

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
  };
  return map[mimeType] || 'bin';
}

export function DocumentViewer({ visible, onDismiss, document, onEdit }: DocumentViewerProps) {
  const { theme } = useAppTheme();
  const [state, setState] = useState<ViewerState>('loading');
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const fullUrlRef = useRef<string>('');
  const authHeadersRef = useRef<Record<string, string>>({});
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const isImage = document?.mimeType.startsWith('image/') ?? false;
  const isPdf = document?.mimeType === 'application/pdf';
  const backgroundColor = isImage ? '#000000' : theme.colors.background.default;
  const headerTextColor = isImage ? '#FFFFFF' : theme.colors.text.primary;

  const resetState = useCallback(() => {
    setState('loading');
    setCachedUri(null);
    fullUrlRef.current = '';
    authHeadersRef.current = {};
    loadingRef.current = false;
  }, []);

  const handleDismiss = useCallback(() => {
    resetState();
    onDismiss();
  }, [onDismiss, resetState]);

  const loadDocument = useCallback(async () => {
    if (!document || loadingRef.current) return;
    loadingRef.current = true;

    try {
      const docWithUrl = await walletApi.getDocument(document.id);
      if (!mountedRef.current) return;

      if (!docWithUrl.downloadUrl) {
        setState('error');
        return;
      }

      const fullUrl = `${API_CONFIG.BASE_URL}${API_PATHS.wallet.files(docWithUrl.downloadUrl)}`;
      fullUrlRef.current = fullUrl;

      const token = await getSupabaseJWT();
      const authHeaders = { Authorization: `Bearer ${token}` };
      authHeadersRef.current = authHeaders;

      // Android PDFs and unsupported types: open in browser immediately
      if ((isPdf && Platform.OS === 'android') || (!isImage && !isPdf)) {
        await WebBrowser.openBrowserAsync(fullUrl);
        if (mountedRef.current) handleDismiss();
        return;
      }

      // Images: download to cache for display
      if (isImage) {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }

        const ext = getExtension(document.mimeType);
        const localUri = `${CACHE_DIR}${document.id}.${ext}`;
        const result = await FileSystem.downloadAsync(fullUrl, localUri, { headers: authHeaders });

        if (!mountedRef.current) return;

        if (result.status >= 200 && result.status < 400) {
          setCachedUri(result.uri);
          setState('viewing');
        } else {
          logger.error('WALLET', `Image download failed with status ${result.status}`);
          setState('error');
        }
        return;
      }

      // iOS PDFs: render via WebView (state set to viewing, URL used directly)
      if (isPdf && Platform.OS === 'ios') {
        setState('viewing');
        return;
      }
    } catch (error) {
      logger.error('WALLET', 'Failed to load document for viewer', error);
      if (mountedRef.current) setState('error');
    } finally {
      loadingRef.current = false;
    }
  }, [document, isImage, isPdf, handleDismiss]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible && document) {
      resetState();
      const timeout = setTimeout(() => loadDocument(), 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visible, document?.id]);

  const handleRetry = useCallback(() => {
    resetState();
    loadDocument();
  }, [resetState, loadDocument]);

  const handleMenu = useCallback(() => {
    if (!document) return;
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];

    if (onEdit) {
      options.push({
        text: 'Edit Details',
        onPress: () => {
          handleDismiss();
          onEdit(document);
        },
      });
    }

    if (fullUrlRef.current) {
      options.push({
        text: 'Open in Browser',
        onPress: () => WebBrowser.openBrowserAsync(fullUrlRef.current),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(document.name, undefined, options);
  }, [document, onEdit, handleDismiss]);

  const renderViewer = useCallback(() => {
    if (isImage && cachedUri) {
      return (
        <ScrollView
          minimumZoomScale={1}
          maximumZoomScale={3}
          centerContent
          bouncesZoom
          contentContainerStyle={styles.imageScrollContent}
          style={styles.imageScroll}
        >
          <Image source={{ uri: cachedUri }} resizeMode="contain" style={styles.image} />
        </ScrollView>
      );
    }

    if (isPdf && Platform.OS === 'ios' && fullUrlRef.current) {
      return (
        <WebView
          source={{ uri: fullUrlRef.current, headers: authHeadersRef.current }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
          )}
        />
      );
    }

    return null;
  }, [isImage, isPdf, cachedUri, theme.colors.primary.main]);

  const renderError = useCallback(
    () => (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={theme.colors.text.tertiary} />
        <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
          Failed to load document
        </Text>
        <Pressable
          onPress={handleRetry}
          style={[styles.retryButton, { borderColor: theme.colors.text.tertiary }]}
        >
          <Text style={[styles.retryText, { color: theme.colors.text.primary }]}>Retry</Text>
        </Pressable>
        {fullUrlRef.current ? (
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(fullUrlRef.current)}
            style={styles.fallbackButton}
          >
            <Text style={[styles.fallbackText, { color: theme.colors.text.tertiary }]}>
              Open in Browser
            </Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [theme, handleRetry]
  );

  // Don't render modal for types that open in browser immediately
  if (!visible || !document) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor }]}>
          <Pressable onPress={handleDismiss} hitSlop={8} accessibilityLabel="Close document viewer">
            <X size={24} color={headerTextColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: headerTextColor }]} numberOfLines={1}>
            {document.name}
          </Text>
          <Pressable onPress={handleMenu} hitSlop={8} accessibilityLabel="Document options">
            <MoreVertical size={24} color={headerTextColor} />
          </Pressable>
        </View>

        {/* Content */}
        {state === 'loading' && (
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={isImage ? '#FFFFFF' : theme.colors.primary.main}
            />
          </View>
        )}
        {state === 'viewing' && renderViewer()}
        {state === 'error' && renderError()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  fallbackText: {
    fontSize: 14,
  },
});
