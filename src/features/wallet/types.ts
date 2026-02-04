// src/features/wallet/types.ts
// Type definitions for wallet documents

/**
 * Document type categories
 */
export type DocumentType =
  | 'passport'
  | 'visa'
  | 'insurance'
  | 'vaccination'
  | 'loyalty_card'
  | 'flight_booking'
  | 'hotel_booking'
  | 'reservation'
  | 'receipt'
  | 'other';

/**
 * Wallet type - personal or group (trip-associated)
 */
export type WalletType = 'personal' | 'group';

/**
 * Metadata for travel documents (passport, visa, etc.)
 */
export interface TravelDocumentMetadata {
  documentNumber?: string;
  issuingCountry?: string;
  expiryDate?: string; // ISO date string
  issueDate?: string; // ISO date string
}

/**
 * Metadata for booking documents (flights, hotels, etc.)
 */
export interface BookingMetadata {
  confirmationNumber?: string;
  provider?: string; // Airline, hotel chain, etc.
  departureTime?: string; // ISO datetime for flights
  arrivalTime?: string; // ISO datetime for flights
  checkInDate?: string; // ISO date for hotels
  checkOutDate?: string; // ISO date for hotels
  location?: string; // Address or destination
}

/**
 * Metadata for receipts
 */
export interface ReceiptMetadata {
  amount?: number;
  currency?: string;
  merchant?: string;
  category?: 'accommodation' | 'food' | 'transport' | 'activity' | 'shopping' | 'other';
  date?: string; // ISO date string
}

/**
 * Metadata for loyalty cards
 */
export interface LoyaltyCardMetadata {
  programName?: string;
  memberNumber?: string;
  tier?: string;
  expiryDate?: string;
}

/**
 * Union type for all metadata variants
 */
export type DocumentMetadata =
  | TravelDocumentMetadata
  | BookingMetadata
  | ReceiptMetadata
  | LoyaltyCardMetadata
  | Record<string, unknown>; // For 'other' type

/**
 * Core wallet document entity
 */
export interface WalletDocument {
  id: string;
  userId: string;
  walletType: WalletType;
  tripId?: string; // Required for group, null for personal
  documentType: DocumentType;
  name: string;
  description?: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  metadata: DocumentMetadata;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Input for creating a new document
 */
export interface CreateDocumentInput {
  walletType: WalletType;
  tripId?: string;
  documentType: DocumentType;
  name: string;
  description?: string;
  metadata?: DocumentMetadata;
  // File info populated during upload
  fileUri: string; // Local file URI
  mimeType: string;
}

/**
 * Input for updating a document
 */
export interface UpdateDocumentInput {
  name?: string;
  description?: string;
  documentType?: DocumentType;
  metadata?: DocumentMetadata;
}

/**
 * Filters for querying documents
 */
export interface DocumentFilters {
  walletType?: WalletType;
  tripId?: string;
  documentType?: DocumentType | DocumentType[];
  search?: string;
}

/**
 * Document with signed URL for viewing
 */
export interface WalletDocumentWithUrl extends WalletDocument {
  signedUrl: string;
  urlExpiresAt: string;
}

/**
 * Backend response shape (snake_case)
 */
export interface WalletDocumentResponse {
  id: string;
  user_id: string;
  wallet_type: WalletType;
  trip_id: string | null;
  document_type: DocumentType;
  name: string;
  description: string | null;
  storage_path: string;
  mime_type: string;
  file_size: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
