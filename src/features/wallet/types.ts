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
 * Matches the Go backend camelCase JSON response
 */
export interface WalletDocument {
  id: string;
  userId: string;
  walletType: WalletType;
  tripId?: string; // Required for group, null for personal
  documentType: DocumentType;
  name: string;
  description?: string;
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
 * Document with download URL (returned by GET single document endpoint)
 */
export interface WalletDocumentWithUrl extends WalletDocument {
  downloadUrl: string;
}

// ============================================================
// Phase C: LLM Document Extraction Contracts (future sprint)
// API: POST /v1/wallet/documents/:id/extract
// No implementation yet — contracts only.
// ============================================================

/**
 * Request body for document extraction
 */
export interface ExtractionRequest {
  ocrText: string; // Text extracted on-device
  documentType?: DocumentType; // Optional hint for extraction
}

/**
 * Response from extraction endpoint
 */
export interface ExtractionResponse {
  extractedData: ExtractedData;
  confidence: number; // 0-1 overall confidence
  suggestedType: DocumentType;
}

/**
 * Confidence thresholds for extraction UI behavior:
 * - < 0.5: warn user, suggest manual entry
 * - 0.5-0.8: show editable review screen with pre-filled fields
 * - >= 0.8: auto-fill metadata (user can still edit)
 */
export const EXTRACTION_CONFIDENCE = {
  LOW: 0.5,
  HIGH: 0.8,
} as const;

/**
 * Union of all extraction result types
 */
export type ExtractedData =
  | FlightBookingExtraction
  | HotelBookingExtraction
  | ReceiptExtraction
  | GenericExtraction;

/**
 * Extracted fields from a flight booking document
 */
export interface FlightBookingExtraction {
  type: 'flight_booking';
  passengerName?: string;
  flightNumber?: string;
  departureAirport?: string; // IATA code
  arrivalAirport?: string; // IATA code
  departureDate?: string; // ISO date
  arrivalDate?: string; // ISO date
  bookingReference?: string;
  confidence: number;
}

/**
 * Extracted fields from a hotel booking document
 */
export interface HotelBookingExtraction {
  type: 'hotel_booking';
  hotelName?: string;
  address?: string;
  checkInDate?: string; // ISO date
  checkOutDate?: string; // ISO date
  confirmationNumber?: string;
  guestName?: string;
  confidence: number;
}

/**
 * Extracted fields from a receipt
 */
export interface ReceiptExtraction {
  type: 'receipt';
  merchantName?: string;
  date?: string; // ISO date
  totalAmount?: {
    amount: number;
    currency: string; // ISO 4217 code
  };
  lineItems?: {
    description: string;
    amount: number;
  }[];
  confidence: number;
}

/**
 * Fallback for unrecognized document types
 */
export interface GenericExtraction {
  type: 'other';
  fields: Record<string, string>;
  confidence: number;
}
