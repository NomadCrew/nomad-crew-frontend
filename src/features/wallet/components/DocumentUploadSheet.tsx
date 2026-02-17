// src/features/wallet/components/DocumentUploadSheet.tsx
// Action sheet for uploading documents — 3-step flow (pick source → review → upload)

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Modal, Portal, Text, ProgressBar, TextInput } from 'react-native-paper';
import { Camera, Image, FileText, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { DocumentType, WalletDocument, WalletType } from '../types';
import { useDocumentPicker, useDocumentUpload, PickerType } from '../hooks';
import { PickedFile } from '../services';
import { detectDocumentType, DOCUMENT_TYPE_LABELS } from '../utils';
import { isImageMimeType, generateAndCacheThumbnail } from '../services';

interface DocumentUploadSheetProps {
  visible: boolean;
  onDismiss: () => void;
  walletType: WalletType;
  tripId?: string;
  onUploadComplete?: (document: WalletDocument) => void;
}

type SheetState = 'idle' | 'reviewing' | 'uploading';

const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'passport',
  'visa',
  'insurance',
  'vaccination',
  'flight_booking',
  'hotel_booking',
  'reservation',
  'receipt',
  'loyalty_card',
  'other',
];

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
  const [sheetState, setSheetState] = useState<SheetState>('idle');
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
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
          maxHeight: '80%',
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
        // Review state styles
        reviewContent: {
          paddingHorizontal: 20,
          paddingBottom: 8,
        },
        fileInfoText: {
          fontSize: 12,
          color: theme.colors.text.secondary,
          marginBottom: 12,
        },
        nameInput: {
          marginBottom: 16,
        },
        sectionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: 10,
        },
        chipContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: theme.colors.surface.variant,
          marginRight: 8,
          marginBottom: 8,
        },
        chipSelected: {
          backgroundColor: theme.colors.primary.main,
        },
        chipText: {
          fontSize: 13,
          color: theme.colors.text.secondary,
        },
        chipTextSelected: {
          color: '#fff',
          fontWeight: '600',
        },
        uploadButton: {
          backgroundColor: theme.colors.text.primary,
          borderRadius: 12,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
        },
        uploadButtonDisabled: {
          opacity: 0.4,
        },
        uploadButtonText: {
          color: theme.colors.background.default,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [theme, insets.bottom]
  );

  const resetState = useCallback(() => {
    setSheetState('idle');
    setPickedFile(null);
    setDocumentName('');
    setDocumentType('other');
    setUploadFileName(null);
    setError(null);
    clearPickerError();
    clearUploadError();
  }, [clearPickerError, clearUploadError]);

  const handleDismiss = useCallback(() => {
    if (isUploading) return;
    if (sheetState === 'reviewing') {
      // Go back to idle instead of dismissing
      setSheetState('idle');
      setPickedFile(null);
      setDocumentName('');
      setDocumentType('other');
      setError(null);
      return;
    }
    resetState();
    onDismiss();
  }, [isUploading, sheetState, onDismiss, resetState]);

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

        setPickedFile(file);
        setDocumentName(nameWithoutExt);
        setDocumentType(detectedType);
        setSheetState('reviewing');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to pick file';
        setError(message);
      }
    },
    [pick, clearPickerError, clearUploadError]
  );

  const handleUpload = useCallback(async () => {
    if (!pickedFile || !documentName.trim()) return;

    setSheetState('uploading');
    setUploadFileName(pickedFile.name);

    try {
      const result = await upload(pickedFile, {
        walletType,
        tripId,
        documentType,
        name: documentName.trim(),
      });

      // Generate thumbnail for images
      if (isImageMimeType(pickedFile.mimeType)) {
        try {
          await generateAndCacheThumbnail(result.id, pickedFile.uri);
        } catch {
          /* thumbnail failure is non-fatal */
        }
      }

      resetState();
      onUploadComplete?.(result);
      onDismiss();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setSheetState('reviewing'); // Go back to review on error
    }
  }, [
    pickedFile,
    documentName,
    documentType,
    upload,
    walletType,
    tripId,
    resetState,
    onUploadComplete,
    onDismiss,
  ]);

  const displayError = error || pickerError || uploadError;

  const renderContent = () => {
    if (sheetState === 'uploading') {
      return (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress !== null ? progress / 100 : 0}
            color={theme.colors.primary.main}
          />
          <Text style={styles.progressText}>Uploading {uploadFileName}...</Text>
          {displayError && <Text style={styles.errorText}>{displayError}</Text>}
        </View>
      );
    }

    if (sheetState === 'reviewing') {
      const isUploadDisabled = !documentName.trim();
      return (
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.reviewContent}>
            {pickedFile && (
              <Text style={styles.fileInfoText} numberOfLines={1}>
                {pickedFile.name}
              </Text>
            )}

            <TextInput
              mode="outlined"
              label="Document Name"
              value={documentName}
              onChangeText={setDocumentName}
              autoFocus
              style={styles.nameInput}
            />

            <Text style={styles.sectionLabel}>Document Type</Text>
            <View style={styles.chipContainer}>
              {ALL_DOCUMENT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.chip, documentType === type && styles.chipSelected]}
                  onPress={() => setDocumentType(type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: documentType === type }}
                >
                  <Text style={[styles.chipText, documentType === type && styles.chipTextSelected]}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {displayError && <Text style={styles.errorText}>{displayError}</Text>}

            <Pressable
              style={[styles.uploadButton, isUploadDisabled && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={isUploadDisabled}
            >
              <Text style={styles.uploadButtonText}>Upload</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    // idle state
    return (
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
    );
  };

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

          {renderContent()}

          {/* Cancel */}
          <View style={styles.separator} />
          <Pressable style={styles.cancelButton} onPress={handleDismiss} disabled={isUploading}>
            <Text style={styles.cancelText}>{sheetState === 'reviewing' ? 'Back' : 'Cancel'}</Text>
          </Pressable>
        </View>
      </Modal>
    </Portal>
  );
};
