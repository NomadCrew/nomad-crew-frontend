// src/features/wallet/services/index.ts
// Re-export wallet services (client-side only — storage is handled by the backend)

// Document picker
export { type PickedFile, pickImage, pickDocument, takePhoto } from './documentPicker';

// Image compression
export { compressImage, compressImageWithInfo, shouldCompress } from './imageCompressor';

// Thumbnail generation and caching
export {
  isImageMimeType,
  generateAndCacheThumbnail,
  getCachedThumbnailUri,
  loadThumbnailCache,
} from './thumbnailService';

// File size constant (used for client-side validation before upload)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
