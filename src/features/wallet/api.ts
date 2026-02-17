// src/features/wallet/api.ts
// API layer for wallet documents — all calls go through the Go backend
//
// Upload functions use expo-file-system's native uploadAsync instead of
// axios + FormData.  This bypasses the RN FormData polyfill entirely,
// letting the OS construct the multipart body with the correct boundary.

import { api } from '@/src/api/api-client';
import { getSupabaseJWT } from '@/src/api/api-client';
import { API_CONFIG } from '@/src/api/env';
import { API_PATHS } from '@/src/utils/api-paths';
import * as FileSystem from 'expo-file-system';
import type {
  WalletDocument,
  CreateDocumentInput,
  UpdateDocumentInput,
  WalletDocumentWithUrl,
} from './types';

interface PaginatedResponse<T> {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
}

/** Progress callback signature */
export type UploadProgressCallback = (progress: {
  totalBytesSent: number;
  totalBytesExpectedToSend: number;
}) => void;

/**
 * Parse the uploadAsync response, which returns { status, headers, body }.
 * The body is a JSON string — we need to parse it and handle errors.
 */
function parseUploadResponse(response: FileSystem.FileSystemUploadResult): WalletDocument {
  const status = response.status;
  if (status < 200 || status >= 300) {
    let message = `Upload failed with status ${status}`;
    try {
      const parsed = JSON.parse(response.body);
      message = parsed.message || parsed.error || message;
    } catch {
      // body wasn't JSON — use the raw text
      if (response.body) message = response.body;
    }
    throw new Error(message);
  }

  return JSON.parse(response.body) as WalletDocument;
}

export const walletApi = {
  /**
   * Upload a personal document using native multipart upload.
   * Returns an upload task so the caller can track progress and cancel.
   */
  uploadPersonal: async (
    input: CreateDocumentInput,
    fileUri: string,
    onProgress?: UploadProgressCallback
  ): Promise<WalletDocument> => {
    const token = await getSupabaseJWT();
    const url = `${API_CONFIG.BASE_URL}${API_PATHS.wallet.documents}`;

    const metadata = JSON.stringify({
      walletType: 'personal',
      documentType: input.documentType,
      name: input.name,
      description: input.description,
      metadata: input.metadata,
    });

    const task = FileSystem.createUploadTask(
      url,
      fileUri,
      {
        fieldName: 'file',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // DO NOT set Content-Type — uploadAsync sets multipart/form-data with boundary
        },
        parameters: { metadata },
        mimeType: input.mimeType,
      },
      onProgress
    );

    const response = await task.uploadAsync();
    if (!response) throw new Error('Upload was cancelled');
    return parseUploadResponse(response);
  },

  /**
   * Upload a group document using native multipart upload.
   */
  uploadGroup: async (
    tripId: string,
    input: CreateDocumentInput,
    fileUri: string,
    onProgress?: UploadProgressCallback
  ): Promise<WalletDocument> => {
    const token = await getSupabaseJWT();
    const url = `${API_CONFIG.BASE_URL}${API_PATHS.wallet.groupDocuments(tripId)}`;

    const metadata = JSON.stringify({
      walletType: 'group',
      tripId,
      documentType: input.documentType,
      name: input.name,
      description: input.description,
      metadata: input.metadata,
    });

    const task = FileSystem.createUploadTask(
      url,
      fileUri,
      {
        fieldName: 'file',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        parameters: { metadata },
        mimeType: input.mimeType,
      },
      onProgress
    );

    const response = await task.uploadAsync();
    if (!response) throw new Error('Upload was cancelled');
    return parseUploadResponse(response);
  },

  /** List personal documents */
  listPersonal: async (limit = 50, offset = 0): Promise<PaginatedResponse<WalletDocument>> => {
    const response = await api.get<PaginatedResponse<WalletDocument>>(API_PATHS.wallet.documents, {
      params: { limit, offset },
    });
    return response.data;
  },

  /** List group documents for a trip */
  listGroup: async (
    tripId: string,
    limit = 50,
    offset = 0
  ): Promise<PaginatedResponse<WalletDocument>> => {
    const response = await api.get<PaginatedResponse<WalletDocument>>(
      API_PATHS.wallet.groupDocuments(tripId),
      { params: { limit, offset } }
    );
    return response.data;
  },

  /** Get a single document with its download URL */
  getDocument: async (id: string): Promise<WalletDocumentWithUrl> => {
    const response = await api.get<WalletDocumentWithUrl>(API_PATHS.wallet.document(id));
    return response.data;
  },

  /** Update document metadata */
  updateDocument: async (id: string, input: UpdateDocumentInput): Promise<WalletDocument> => {
    const response = await api.put<WalletDocument>(API_PATHS.wallet.document(id), input);
    return response.data;
  },

  /** Delete a document */
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(API_PATHS.wallet.document(id));
  },
};
