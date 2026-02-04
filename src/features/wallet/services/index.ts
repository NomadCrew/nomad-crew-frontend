// src/features/wallet/services/index.ts
// Re-export all wallet services

// Document picker
export { type PickedFile, pickImage, pickDocument, takePhoto } from './documentPicker';

// Image compression
export { compressImage, compressImageWithInfo, shouldCompress } from './imageCompressor';

// Storage upload
export {
  STORAGE_BUCKET,
  MAX_FILE_SIZE,
  type UploadResult,
  generateStoragePath,
  uploadDocument,
  getSignedUrl,
  deleteDocument,
  isWithinSizeLimit,
} from './storageUpload';
