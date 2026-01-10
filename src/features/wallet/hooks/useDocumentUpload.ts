// src/features/wallet/hooks/useDocumentUpload.ts
// React hook for document upload functionality

import { useCallback } from 'react';
import { useWalletStore } from '../store';
import { CreateDocumentInput, DocumentType, WalletType } from '../types';
import { PickedFile } from '../services';

/**
 * Metadata input for uploads (excludes file info which comes from PickedFile)
 */
export interface UploadMetadata {
  walletType: WalletType;
  tripId?: string;
  documentType: DocumentType;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hook for uploading documents
 * Provides a clean API for UI components to upload files with progress tracking
 */
export function useDocumentUpload() {
  const uploadDocument = useWalletStore((state) => state.uploadDocument);
  const uploadProgress = useWalletStore((state) => state.uploadProgress);
  const uploadError = useWalletStore((state) => state.uploadError);
  const clearStoreError = useWalletStore((state) => state.clearError);

  /**
   * Upload a picked file with metadata
   * @param file - File from useDocumentPicker
   * @param metadata - Document metadata (name, type, etc.)
   * @returns The created WalletDocument
   */
  const upload = useCallback(
    async (file: PickedFile, metadata: UploadMetadata) => {
      const input: CreateDocumentInput = {
        ...metadata,
        fileUri: file.uri,
        mimeType: file.mimeType,
      };

      return uploadDocument(input);
    },
    [uploadDocument]
  );

  /**
   * Clear any upload error
   */
  const clearError = useCallback(() => {
    clearStoreError();
  }, [clearStoreError]);

  return {
    // Upload function
    upload,

    // Progress state (0-100, or null when not uploading)
    progress: uploadProgress,

    // Error state
    error: uploadError,
    clearError,

    // Convenience boolean for UI
    isUploading: uploadProgress !== null,
  };
}
