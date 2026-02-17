// src/features/wallet/hooks/index.ts
// Re-export all wallet hooks

// Document picker hook
export { useDocumentPicker, type PickerType } from './useDocumentPicker';

// Document upload hook
export { useDocumentUpload, type UploadMetadata } from './useDocumentUpload';

// Re-export store selector hooks for convenience
export {
  usePersonalDocuments,
  useGroupDocuments,
  useWalletLoading,
  useWalletError,
  useSelectedDocument,
  useUploadProgress,
  useUploadError,
} from '../store';
