// src/features/wallet/adapters/normalizeDocument.ts
// Legacy adapter — no longer needed since the Go backend returns camelCase JSON.
// Kept as a no-op passthrough for any code that may still reference it.

import { WalletDocument } from '../types';

export function normalizeDocument(response: WalletDocument): WalletDocument {
  return response;
}

export function normalizeDocuments(responses: WalletDocument[]): WalletDocument[] {
  return responses;
}
