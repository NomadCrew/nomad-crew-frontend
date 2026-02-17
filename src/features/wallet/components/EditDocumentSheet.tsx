// src/features/wallet/components/EditDocumentSheet.tsx
// Bottom sheet for editing document name and type

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useWalletStore } from '../store';
import { DOCUMENT_TYPE_LABELS } from '../utils';
import type { WalletDocument, DocumentType, UpdateDocumentInput } from '../types';

interface EditDocumentSheetProps {
  visible: boolean;
  onDismiss: () => void;
  document: WalletDocument | null;
  onUpdated?: (updated: WalletDocument) => void;
}

const ALL_DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

export const EditDocumentSheet: React.FC<EditDocumentSheetProps> = ({
  visible,
  onDismiss,
  document,
  onUpdated,
}) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType>('other');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setName(document.name);
      setSelectedType(document.documentType);
      setError(null);
    }
  }, [document]);

  const hasChanges =
    name.trim() !== (document?.name ?? '') || selectedType !== (document?.documentType ?? 'other');

  const handleSave = useCallback(async () => {
    if (!document || !name.trim()) return;

    const changes: UpdateDocumentInput = {};
    if (name.trim() !== document.name) changes.name = name.trim();
    if (selectedType !== document.documentType) changes.documentType = selectedType;

    if (Object.keys(changes).length === 0) {
      onDismiss();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await useWalletStore.getState().updateDocument(document.id, changes);
      onUpdated?.(updated);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setIsSaving(false);
    }
  }, [document, name, selectedType, onDismiss, onUpdated]);

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
        scrollContent: {
          paddingHorizontal: 20,
        },
        sectionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text.secondary,
          marginTop: 16,
          marginBottom: 8,
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
        saveButton: {
          backgroundColor: theme.colors.text.primary,
          borderRadius: 12,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
          marginHorizontal: 20,
        },
        saveButtonDisabled: {
          opacity: 0.4,
        },
        saveButtonText: {
          color: '#fff',
          fontSize: 16,
          fontWeight: '600',
        },
        errorText: {
          fontSize: 14,
          color: theme.colors.status.error.content,
          marginTop: 8,
        },
      }),
    [theme, insets.bottom]
  );

  const isDisabled = !name.trim() || isSaving;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Document</Text>
            <Pressable
              onPress={onDismiss}
              style={styles.closeButton}
              disabled={isSaving}
              hitSlop={8}
            >
              <X size={24} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.scrollContent}>
              <TextInput
                mode="outlined"
                label="Document Name"
                value={name}
                onChangeText={setName}
                disabled={isSaving}
              />

              <Text style={styles.sectionLabel}>Document Type</Text>
              <View style={styles.chipContainer}>
                {ALL_DOCUMENT_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, selectedType === type && styles.chipSelected]}
                    onPress={() => setSelectedType(type)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedType === type }}
                  >
                    <Text
                      style={[styles.chipText, selectedType === type && styles.chipTextSelected]}
                    >
                      {DOCUMENT_TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </ScrollView>

          {/* Save button */}
          <Pressable
            style={[styles.saveButton, isDisabled && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isDisabled}
          >
            <Text style={styles.saveButtonText}>{hasChanges ? 'Save' : 'No Changes'}</Text>
          </Pressable>
        </View>
      </Modal>
    </Portal>
  );
};
