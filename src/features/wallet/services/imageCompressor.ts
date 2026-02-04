// src/features/wallet/services/imageCompressor.ts
// Image compression service using expo-image-manipulator

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Maximum dimension for resized images (maintains aspect ratio)
 */
const MAX_DIMENSION = 1920;

/**
 * JPEG compression quality (0-1)
 */
const COMPRESSION_QUALITY = 0.8;

/**
 * MIME types that should be compressed
 */
const COMPRESSIBLE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
];

/**
 * Check if a file type should be compressed
 * @param mimeType - The MIME type to check
 * @returns true if the file should be compressed
 */
export function shouldCompress(mimeType: string): boolean {
  const normalizedType = mimeType.toLowerCase();
  return COMPRESSIBLE_TYPES.includes(normalizedType) || normalizedType.startsWith('image/');
}

/**
 * Compress an image by resizing and re-encoding as JPEG
 * Reduces file size by 80-90% while maintaining visual quality
 *
 * @param uri - Local file URI of the image to compress
 * @returns Compressed image URI
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}

/**
 * Get compressed image with metadata
 * Useful when you need both the URI and dimensions
 *
 * @param uri - Local file URI of the image to compress
 * @returns Object with uri, width, and height
 */
export async function compressImageWithInfo(uri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
