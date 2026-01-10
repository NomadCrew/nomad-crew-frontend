// src/features/wallet/adapters/normalizeDocument.ts
// Transform backend wallet document data to frontend shape

import { WalletDocument, WalletDocumentResponse, DocumentMetadata } from '../types';

/**
 * Normalizes a backend wallet document response to frontend format.
 * Handles snake_case to camelCase conversion and provides defaults.
 *
 * @param response - Raw backend response
 * @returns Normalized WalletDocument
 */
export function normalizeDocument(response: WalletDocumentResponse): WalletDocument {
  return {
    id: response.id,
    userId: response.user_id,
    walletType: response.wallet_type,
    tripId: response.trip_id ?? undefined,
    documentType: response.document_type,
    name: response.name,
    description: response.description ?? undefined,
    storagePath: response.storage_path,
    mimeType: response.mime_type,
    fileSize: response.file_size,
    metadata: normalizeMetadata(response.metadata),
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Normalizes metadata, ensuring it's a valid object.
 * Converts snake_case keys to camelCase.
 */
function normalizeMetadata(metadata: Record<string, unknown> | null): DocumentMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  // Convert snake_case keys to camelCase if present
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    normalized[camelKey] = value;
  }

  return normalized;
}

/**
 * Normalizes an array of documents
 */
export function normalizeDocuments(responses: WalletDocumentResponse[]): WalletDocument[] {
  return responses.map(normalizeDocument);
}
