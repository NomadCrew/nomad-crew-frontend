// src/features/wallet/utils.ts
// Shared utilities for wallet document management

import type { LucideIcon } from 'lucide-react-native';
import {
  Shield,
  Heart,
  Calendar,
  CreditCard,
  FileText,
  File,
  Plane,
  Building2,
  Receipt,
  Syringe,
} from 'lucide-react-native';
import type { DocumentType, WalletDocument } from './types';

// ── Document Type Groups (10 types → 5 groups) ─────────────────────

export interface DocumentTypeGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  types: DocumentType[];
}

export const DOCUMENT_TYPE_GROUPS: DocumentTypeGroup[] = [
  { key: 'identity', label: 'Identity', icon: Shield, types: ['passport', 'visa'] },
  { key: 'medical', label: 'Medical', icon: Heart, types: ['insurance', 'vaccination'] },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    types: ['flight_booking', 'hotel_booking', 'reservation'],
  },
  { key: 'finance', label: 'Finance', icon: CreditCard, types: ['receipt', 'loyalty_card'] },
  { key: 'other', label: 'Other', icon: FileText, types: ['other'] },
];

// ── Get group for a document type ───────────────────────────────────

export function getDocumentGroup(type: DocumentType): DocumentTypeGroup {
  return DOCUMENT_TYPE_GROUPS.find((g) => g.types.includes(type)) ?? DOCUMENT_TYPE_GROUPS[4]!;
}

// ── Icon per document type ──────────────────────────────────────────

const DOCUMENT_TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  passport: Shield,
  visa: FileText,
  insurance: Heart,
  vaccination: Syringe,
  flight_booking: Plane,
  hotel_booking: Building2,
  reservation: Calendar,
  receipt: Receipt,
  loyalty_card: CreditCard,
  other: File,
};

export function getDocumentTypeIcon(type: DocumentType): LucideIcon {
  return DOCUMENT_TYPE_ICONS[type] ?? File;
}

// ── Auto-detect document type from filename ─────────────────────────

export function detectDocumentType(filename: string): DocumentType {
  const lower = filename.toLowerCase();

  if (lower.includes('passport')) return 'passport';
  if (lower.includes('visa')) return 'visa';
  if (lower.includes('insurance')) return 'insurance';
  if (lower.includes('vaccin') || lower.includes('covid')) return 'vaccination';
  if (lower.includes('flight') || lower.includes('boarding') || lower.includes('airline'))
    return 'flight_booking';
  if (lower.includes('hotel') || lower.includes('airbnb')) return 'hotel_booking';
  if (lower.includes('reserv') || lower.includes('booking')) return 'reservation';
  if (lower.includes('receipt') || lower.includes('invoice')) return 'receipt';
  if (lower.includes('loyalty') || lower.includes('member') || lower.includes('card'))
    return 'loyalty_card';
  return 'other';
}

// ── Human-readable type label ───────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  insurance: 'Insurance',
  vaccination: 'Vaccination',
  loyalty_card: 'Loyalty Card',
  flight_booking: 'Flight',
  hotel_booking: 'Hotel',
  reservation: 'Reservation',
  receipt: 'Receipt',
  other: 'Document',
};

export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] ?? 'Document';
}

// ── Context line formatter ──────────────────────────────────────────

export function getDocumentContextLine(doc: WalletDocument): string {
  const typeLabel = getDocumentTypeLabel(doc.documentType);
  const size = formatFileSize(doc.fileSize);
  return `${typeLabel} \u00b7 ${size}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Group documents by type group (for sections) ────────────────────

export interface DocumentSection {
  key: string;
  label: string;
  icon: LucideIcon;
  data: WalletDocument[];
}

export function groupDocumentsByType(documents: WalletDocument[]): DocumentSection[] {
  return DOCUMENT_TYPE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    icon: group.icon,
    data: documents.filter((doc) => group.types.includes(doc.documentType)),
  })).filter((section) => section.data.length > 0);
}
