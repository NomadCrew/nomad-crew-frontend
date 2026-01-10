// src/features/wallet/components/DocumentListItem.tsx
// Individual document item for wallet document lists

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { WalletDocument, DocumentType } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface DocumentListItemProps {
  document: WalletDocument;
  onPress: (document: WalletDocument) => void;
  onDelete?: (document: WalletDocument) => void;
}

/**
 * Get icon name based on document MIME type
 */
function getDocumentIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') {
    return 'file-pdf-box';
  }
  if (mimeType.startsWith('image/')) {
    return 'file-image';
  }
  return 'file-document';
}

/**
 * Get human-readable label for document type
 */
function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    passport: 'Passport',
    visa: 'Visa',
    insurance: 'Insurance',
    vaccination: 'Vaccination',
    loyalty_card: 'Loyalty Card',
    flight_booking: 'Flight',
    hotel_booking: 'Hotel',
    reservation: 'Reservation',
    receipt: 'Receipt',
    other: 'Other',
  };
  return labels[type] ?? 'Document';
}

/**
 * Get chip color based on document type
 */
function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    passport: '#2196F3', // Blue
    visa: '#9C27B0', // Purple
    insurance: '#4CAF50', // Green
    vaccination: '#FF9800', // Orange
    loyalty_card: '#E91E63', // Pink
    flight_booking: '#00BCD4', // Cyan
    hotel_booking: '#795548', // Brown
    reservation: '#607D8B', // Blue Grey
    receipt: '#8BC34A', // Light Green
    other: '#9E9E9E', // Grey
  };
  return colors[type] ?? '#9E9E9E';
}

/**
 * Format file size in KB or MB
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  onPress,
  onDelete,
}) => {
  const { theme } = useAppTheme();

  const iconName = useMemo(() => getDocumentIcon(document.mimeType), [document.mimeType]);
  const typeLabel = useMemo(
    () => getDocumentTypeLabel(document.documentType),
    [document.documentType]
  );
  const typeColor = useMemo(
    () => getDocumentTypeColor(document.documentType),
    [document.documentType]
  );
  const fileSize = useMemo(() => formatFileSize(document.fileSize), [document.fileSize]);

  const formattedDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(document.createdAt), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  }, [document.createdAt]);

  const handlePress = useCallback(() => {
    onPress(document);
  }, [document, onPress]);

  const handleDelete = useCallback(() => {
    onDelete?.(document);
  }, [document, onDelete]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 12,
          backgroundColor: theme.colors.surface.default,
        },
        touchable: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
        },
        iconContainer: {
          width: 48,
          height: 48,
          borderRadius: 8,
          backgroundColor: theme.colors.background.surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        contentContainer: {
          flex: 1,
          marginRight: 8,
        },
        nameText: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: 4,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        },
        chip: {
          height: 24,
          marginRight: 8,
        },
        chipText: {
          fontSize: 11,
          fontWeight: '500',
        },
        infoText: {
          fontSize: 12,
          color: theme.colors.text.secondary,
        },
        dateText: {
          fontSize: 12,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
        deleteButton: {
          marginLeft: 4,
        },
      }),
    [theme]
  );

  return (
    <Surface style={styles.container} elevation={1}>
      <TouchableOpacity onPress={handlePress} style={styles.touchable}>
        <View style={styles.iconContainer}>
          <IconButton
            icon={iconName}
            size={28}
            iconColor={theme.colors.primary.main}
            style={{ margin: 0 }}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
            {document.name}
          </Text>
          <View style={styles.metaRow}>
            <Chip
              mode="flat"
              compact
              style={[styles.chip, { backgroundColor: typeColor + '20' }]}
              textStyle={[styles.chipText, { color: typeColor }]}
            >
              {typeLabel}
            </Chip>
            <Text style={styles.infoText}>{fileSize}</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        {onDelete && (
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor={theme.colors.text.tertiary}
            onPress={handleDelete}
            style={styles.deleteButton}
          />
        )}
      </TouchableOpacity>
    </Surface>
  );
};
