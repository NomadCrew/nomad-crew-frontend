// src/features/wallet/services/storageUpload.ts
// Supabase Storage upload service for wallet documents

import { supabase } from '@/src/api/supabase';
import { WalletType } from '../types';

/**
 * Supabase Storage bucket name for wallet documents
 */
export const STORAGE_BUCKET = 'wallet-documents';

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Result of a successful upload operation
 */
export interface UploadResult {
  path: string;
  fullPath: string;
}

/**
 * Sanitize a filename for storage
 * Removes special characters and spaces
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate a storage path for a document
 * Personal: personal/{userId}/{timestamp}_{fileName}
 * Group: trips/{tripId}/{timestamp}_{fileName}
 *
 * @param walletType - Type of wallet (personal or group)
 * @param userId - The user's ID
 * @param tripId - Trip ID (required for group wallet)
 * @param fileName - Original file name
 * @returns Storage path string
 */
export function generateStoragePath(
  walletType: WalletType,
  userId: string,
  tripId: string | undefined,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(fileName);

  if (walletType === 'group') {
    if (!tripId) {
      throw new Error('tripId is required for group wallet documents');
    }
    return `trips/${tripId}/${timestamp}_${sanitizedName}`;
  }

  return `personal/${userId}/${timestamp}_${sanitizedName}`;
}

/**
 * Upload a document to Supabase Storage
 * Uses ArrayBuffer pattern for React Native compatibility
 *
 * CRITICAL: This uses fetch().arrayBuffer() - FormData/Blob don't work reliably in React Native
 *
 * @param fileUri - Local file URI to upload
 * @param storagePath - Destination path in storage bucket
 * @param contentType - MIME type of the file
 * @returns Upload result with path information
 */
export async function uploadDocument(
  fileUri: string,
  storagePath: string,
  contentType: string
): Promise<UploadResult> {
  // CRITICAL: Convert to ArrayBuffer for React Native compatibility
  // FormData, Blob, and File constructors don't work reliably in React Native
  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();

  // Check file size
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `File size ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned');
  }

  return {
    path: data.path,
    fullPath: data.fullPath ?? `${STORAGE_BUCKET}/${data.path}`,
  };
}

/**
 * Get a signed URL for accessing a private document
 *
 * @param storagePath - Path to the document in storage
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL string
 */
export async function getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Failed to get signed URL: No URL returned');
  }

  return data.signedUrl;
}

/**
 * Delete a document from storage
 *
 * @param storagePath - Path to the document in storage
 */
export async function deleteDocument(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Check if a file is within the size limit
 *
 * @param fileSize - Size of the file in bytes
 * @returns true if file is within limit
 */
export function isWithinSizeLimit(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}
