// src/features/wallet/components/DocumentUploadSheet.tsx
// Compact action sheet for uploading documents — 2-tap flow (pick source → auto-upload)

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Modal, Portal, Text, ProgressBar } from 'react-native-paper';
import { Camera, Image, FileText, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument, WalletType } from '../types';
import { useDocumentPicker, useDocumentUpload, PickerType } from '../hooks';
import { detectDocumentType } from '../utils';

interface DocumentUploadSheetProps {
  visible: boolean;
  onDismiss: () => void;
  walletType: WalletType;
  tripId?: string;
  onUploadComplete?: (document: WalletDocument) => void;
}

const SOURCE_ROWS: { type: PickerType; label: string; Icon: typeof Camera }[] = [
  { type: 'camera', label: 'Take Photo', Icon: Camera },
  { type: 'image', label: 'Choose from Library', Icon: Image },
  { type: 'document', label: 'Browse Files', Icon: FileText },
];

export const DocumentUploadSheet: React.FC<DocumentUploadSheetProps> = ({
  visible,
  onDismiss,
  walletType,
  tripId,
  onUploadComplete,
}) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    pick,
    isPickerOpen,
    error: pickerError,
    clearError: clearPickerError,
  } = useDocumentPicker();
  const {
    upload,
    progress,
    isUploading,
    error: uploadError,
    clearError: clearUploadError,
  } = useDocumentUpload();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.colors.background.default,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: insets.bottom + 8,
        },
        handle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border.default,
          alignSelf: 'center',
          marginTop: 8,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text.primary,
        },
        closeButton: {
          padding: 4,
        },
        sourceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
          paddingHorizontal: 20,
        },
        sourceLabel: {
          fontSize: 16,
          color: theme.colors.text.primary,
          marginLeft: 16,
        },
        separator: {
          height: 0.5,
          backgroundColor: theme.colors.border.default,
        },
        progressContainer: {
          paddingHorizontal: 20,
          paddingVertical: 16,
        },
        progressText: {
          fontSize: 14,
          color: theme.colors.text.secondary,
          marginTop: 8,
        },
        errorText: {
          fontSize: 14,
          color: theme.colors.status.error.content,
          marginTop: 8,
        },
        cancelButton: {
          alignItems: 'center',
          paddingVertical: 16,
        },
        cancelText: {
          fontSize: 16,
          color: theme.colors.text.secondary,
        },
      }),
    [theme, insets.bottom]
  );

  const resetState = useCallback(() => {
    setUploadFileName(null);
    setError(null);
    clearPickerError();
    clearUploadError();
  }, [clearPickerError, clearUploadError]);

  const handleDismiss = useCallback(() => {
    if (isUploading) return;
    resetState();
    onDismiss();
  }, [isUploading, onDismiss, resetState]);

  const handleSourceTap = useCallback(
    async (type: PickerType) => {
      setError(null);
      clearPickerError();
      clearUploadError();

      try {
        const file = await pick(type);
        if (!file) return; // User cancelled

        const detectedType = detectDocumentType(file.name);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

        setUploadFileName(file.name);

        const result = await upload(file, {
          walletType,
          tripId,
          documentType: detectedType,
          name: nameWithoutExt,
        });

        resetState();
        onUploadComplete?.(result);
        onDismiss();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
      }
    },
    [
      pick,
      upload,
      walletType,
      tripId,
      onUploadComplete,
      onDismiss,
      resetState,
      clearPickerError,
      clearUploadError,
    ]
  );

  const displayError = error || pickerError || uploadError;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Document</Text>
            <Pressable
              onPress={handleDismiss}
              style={styles.closeButton}
              disabled={isUploading}
              hitSlop={8}
            >
              <X size={24} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {isUploading ? (
            /* Upload progress replaces source rows */
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress !== null ? progress / 100 : 0}
                color={theme.colors.primary.main}
              />
              <Text style={styles.progressText}>Uploading {uploadFileName}...</Text>
              {displayError && <Text style={styles.errorText}>{displayError}</Text>}
            </View>
          ) : (
            /* Source rows */
            <>
              {SOURCE_ROWS.map((row, index) => (
                <React.Fragment key={row.type}>
                  {index > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={styles.sourceRow}
                    onPress={() => handleSourceTap(row.type)}
                    disabled={isPickerOpen}
                    android_ripple={{ color: theme.colors.border.default }}
                  >
                    <row.Icon size={24} color={theme.colors.text.secondary} />
                    <Text style={styles.sourceLabel}>{row.label}</Text>
                  </Pressable>
                </React.Fragment>
              ))}
              {displayError && (
                <View style={styles.progressContainer}>
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              )}
            </>
          )}

          {/* Cancel */}
          <View style={styles.separator} />
          <Pressable style={styles.cancelButton} onPress={handleDismiss} disabled={isUploading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </Portal>
  );
};
