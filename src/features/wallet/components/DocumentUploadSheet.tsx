// src/features/wallet/components/DocumentUploadSheet.tsx
// Modal sheet for uploading documents to wallet

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  IconButton,
  Surface,
  ProgressBar,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument, WalletType, DocumentType } from '../types';
import { PickedFile } from '../services';
import { useDocumentPicker, useDocumentUpload, PickerType } from '../hooks';

interface DocumentUploadSheetProps {
  visible: boolean;
  onDismiss: () => void;
  walletType: WalletType;
  tripId?: string; // Required if walletType is 'group'
  onUploadComplete?: (document: WalletDocument) => void;
}

/**
 * Document type options for the dropdown
 */
const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'loyalty_card', label: 'Loyalty Card' },
  { value: 'flight_booking', label: 'Flight Booking' },
  { value: 'hotel_booking', label: 'Hotel Booking' },
  { value: 'reservation', label: 'Reservation' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'other', label: 'Other' },
];

/**
 * Source selection buttons
 */
const SOURCE_OPTIONS: { value: PickerType; label: string; icon: string }[] = [
  { value: 'camera', label: 'Camera', icon: 'camera' },
  { value: 'image', label: 'Gallery', icon: 'image' },
  { value: 'document', label: 'Files', icon: 'file-document' },
];

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentUploadSheet: React.FC<DocumentUploadSheetProps> = ({
  visible,
  onDismiss,
  walletType,
  tripId,
  onUploadComplete,
}) => {
  const { theme } = useAppTheme();

  // Form state
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Hooks
  const {
    pick,
    isPickerOpen,
    error: pickerError,
    clearError: clearPickerError,
  } = useDocumentPicker();
  const {
    upload,
    progress,
    error: uploadError,
    isUploading,
    clearError: clearUploadError,
  } = useDocumentUpload();

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedFile) errors.push('Please select a file');
    if (!name.trim()) errors.push('Name is required');
    if (walletType === 'group' && !tripId) errors.push('Trip ID is required for group wallet');
    return errors;
  }, [selectedFile, name, walletType, tripId]);

  const isValid = validationErrors.length === 0;

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.colors.background.default,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.default,
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: '600',
          color: theme.colors.text.primary,
        },
        content: {
          padding: 16,
        },
        section: {
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text.secondary,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        sourceButtons: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          gap: 12,
        },
        sourceButton: {
          flex: 1,
          alignItems: 'center',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
          backgroundColor: theme.colors.background.surface,
        },
        sourceButtonActive: {
          borderColor: theme.colors.primary.main,
          backgroundColor: theme.colors.primary.surface,
        },
        sourceIcon: {
          marginBottom: 8,
        },
        sourceLabel: {
          fontSize: 12,
          color: theme.colors.text.secondary,
        },
        filePreview: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 8,
          backgroundColor: theme.colors.background.surface,
        },
        fileInfo: {
          flex: 1,
          marginLeft: 12,
        },
        fileName: {
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.text.primary,
        },
        fileSize: {
          fontSize: 12,
          color: theme.colors.text.secondary,
          marginTop: 2,
        },
        typeSelector: {
          marginTop: 8,
        },
        typeButton: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
          marginRight: 8,
          marginBottom: 8,
        },
        typeButtonActive: {
          borderColor: theme.colors.primary.main,
          backgroundColor: theme.colors.primary.surface,
        },
        typeLabel: {
          fontSize: 13,
        },
        input: {
          marginBottom: 12,
          backgroundColor: theme.colors.background.surface,
        },
        progressContainer: {
          marginTop: 8,
        },
        progressText: {
          fontSize: 12,
          color: theme.colors.text.secondary,
          marginTop: 4,
          textAlign: 'center',
        },
        errorText: {
          color: theme.colors.error.main,
          marginBottom: 8,
        },
        footer: {
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.default,
        },
        uploadButton: {
          borderRadius: 8,
        },
        typeGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
      }),
    [theme]
  );

  // Handlers
  const handlePickFile = useCallback(
    async (type: PickerType) => {
      clearPickerError();
      clearUploadError();
      try {
        const file = await pick(type);
        if (file) {
          setSelectedFile(file);
          // Auto-fill name from file name if empty
          if (!name.trim()) {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setName(nameWithoutExt);
          }
        }
      } catch {
        // Error already handled by hook
      }
    },
    [pick, name, clearPickerError, clearUploadError]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !isValid) return;

    try {
      const result = await upload(selectedFile, {
        walletType,
        tripId,
        documentType,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Clear form and notify
      setSelectedFile(null);
      setName('');
      setDescription('');
      setDocumentType('other');
      onUploadComplete?.(result);
      onDismiss();
    } catch {
      // Error already handled by hook
    }
  }, [
    selectedFile,
    isValid,
    upload,
    walletType,
    tripId,
    documentType,
    name,
    description,
    onUploadComplete,
    onDismiss,
  ]);

  const handleDismiss = useCallback(() => {
    if (isUploading) return; // Don't allow dismiss during upload
    setSelectedFile(null);
    setName('');
    setDescription('');
    setDocumentType('other');
    clearPickerError();
    clearUploadError();
    onDismiss();
  }, [isUploading, onDismiss, clearPickerError, clearUploadError]);

  const handleTypeSelect = useCallback((type: string) => {
    setDocumentType(type as DocumentType);
  }, []);

  const renderTypeSelector = () => (
    <View style={styles.typeGrid}>
      {DOCUMENT_TYPE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          mode={documentType === option.value ? 'contained' : 'outlined'}
          compact
          onPress={() => handleTypeSelect(option.value)}
          style={[styles.typeButton, documentType === option.value && styles.typeButtonActive]}
          labelStyle={styles.typeLabel}
        >
          {option.label}
        </Button>
      ))}
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Surface style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Upload Document</Text>
              <IconButton icon="close" onPress={handleDismiss} disabled={isUploading} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Source Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Source</Text>
                <View style={styles.sourceButtons}>
                  {SOURCE_OPTIONS.map((option) => (
                    <Surface
                      key={option.value}
                      style={[styles.sourceButton, selectedFile && styles.sourceButtonActive]}
                      onTouchEnd={() => handlePickFile(option.value)}
                      elevation={1}
                    >
                      <IconButton
                        icon={option.icon}
                        size={28}
                        iconColor={theme.colors.primary.main}
                        style={styles.sourceIcon}
                        disabled={isPickerOpen || isUploading}
                      />
                      <Text style={styles.sourceLabel}>{option.label}</Text>
                    </Surface>
                  ))}
                </View>
                {pickerError && (
                  <HelperText type="error" visible>
                    {pickerError}
                  </HelperText>
                )}
              </View>

              {/* File Preview */}
              {selectedFile && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Selected File</Text>
                  <Surface style={styles.filePreview} elevation={1}>
                    <IconButton
                      icon={
                        selectedFile.mimeType.startsWith('image/') ? 'file-image' : 'file-pdf-box'
                      }
                      size={32}
                      iconColor={theme.colors.primary.main}
                    />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                    </View>
                    <IconButton
                      icon="close-circle"
                      size={20}
                      onPress={() => setSelectedFile(null)}
                      disabled={isUploading}
                    />
                  </Surface>
                </View>
              )}

              {/* Document Type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Document Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedButtons
                    value={documentType}
                    onValueChange={handleTypeSelect}
                    buttons={DOCUMENT_TYPE_OPTIONS.slice(0, 5).map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    style={styles.typeSelector}
                  />
                </ScrollView>
                {renderTypeSelector()}
              </View>

              {/* Name Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Document Name</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Enter document name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  disabled={isUploading}
                />
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description (Optional)</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Add a description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  disabled={isUploading}
                />
              </View>

              {/* Upload Progress */}
              {isUploading && progress !== null && (
                <View style={styles.progressContainer}>
                  <ProgressBar progress={progress / 100} color={theme.colors.primary.main} />
                  <Text style={styles.progressText}>Uploading... {progress}%</Text>
                </View>
              )}

              {/* Error Display */}
              {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={handleUpload}
                loading={isUploading}
                disabled={!isValid || isUploading}
                style={styles.uploadButton}
                buttonColor={theme.colors.primary.main}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};
