// src/features/wallet/services/thumbnailService.ts
// Thumbnail generation and caching service for wallet image documents

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Directory for cached thumbnail files
 */
const THUMBNAIL_DIR = `${FileSystem.cacheDirectory}wallet-thumbnails/`;

/**
 * Thumbnail width in pixels (maintains aspect ratio)
 */
const THUMBNAIL_SIZE = 120;

/**
 * In-memory cache: documentId -> local file URI
 */
const thumbnailCache = new Map<string, string>();

/**
 * Check if a MIME type is an image type suitable for thumbnailing
 * @param mimeType - The MIME type to check
 * @returns true if the type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();
  return (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/png' ||
    normalized === 'image/heic' ||
    normalized === 'image/heif' ||
    normalized === 'image/webp' ||
    normalized.startsWith('image/')
  );
}

/**
 * Ensure the thumbnail cache directory exists
 */
export async function ensureThumbnailDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
  }
}

/**
 * Generate a thumbnail from a local image URI and cache it
 *
 * @param documentId - Unique document identifier (used as filename)
 * @param sourceUri - Local file URI of the source image
 * @returns Local file URI of the generated thumbnail
 */
export async function generateAndCacheThumbnail(
  documentId: string,
  sourceUri: string
): Promise<string> {
  await ensureThumbnailDir();

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL_SIZE } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const thumbnailPath = `${THUMBNAIL_DIR}${documentId}.jpg`;
  await FileSystem.moveAsync({ from: result.uri, to: thumbnailPath });

  thumbnailCache.set(documentId, thumbnailPath);
  return thumbnailPath;
}

/**
 * Synchronous lookup for a cached thumbnail URI
 *
 * @param documentId - The document ID to look up
 * @returns Cached thumbnail URI or null if not cached
 */
export function getCachedThumbnailUri(documentId: string): string | null {
  return thumbnailCache.get(documentId) ?? null;
}

/**
 * Scan the thumbnail directory and populate the in-memory cache
 * Call this at app startup to restore previously generated thumbnails
 */
export async function loadThumbnailCache(): Promise<void> {
  await ensureThumbnailDir();

  const files = await FileSystem.readDirectoryAsync(THUMBNAIL_DIR);
  for (const file of files) {
    if (file.endsWith('.jpg')) {
      const documentId = file.slice(0, -4);
      thumbnailCache.set(documentId, `${THUMBNAIL_DIR}${file}`);
    }
  }
}
