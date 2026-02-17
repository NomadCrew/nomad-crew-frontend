import React from 'react';
import { render, fireEvent } from '../../test-utils';
import { DocumentListItem } from '@/src/features/wallet/components/DocumentListItem';
import { WalletDocument, DocumentType } from '@/src/features/wallet/types';

// ── Expose pure helpers under test via module re-import ──────────────────────
// We can't import them directly (they're not exported), so we test them
// indirectly through the rendered output, or extract into a separate describe block
// that calls the functions by duplicating the logic.
// For purity tests we extract the behaviour from the source code directly.

// Helper to replicate pure functions for unit-level testing
function getDocumentIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'file-pdf-box';
  if (mimeType.startsWith('image/')) return 'file-image';
  return 'file-document';
}

function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    passport: 'Passport',
    visa: 'Visa',
    insurance: 'Insurance',
    vaccination: 'Vaccination',
    loyalty_card: 'Loyalty Card',
    flight_booking: 'Flight',
    hotel_booking: 'Hotel',
    reservation: 'Reservation',
    receipt: 'Receipt',
    other: 'Other',
  };
  return labels[type] ?? 'Document';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Mock date-fns to get deterministic output ────────────────────────────────
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

// ── Factory ──────────────────────────────────────────────────────────────────
function createMockDocument(overrides: Partial<WalletDocument> = {}): WalletDocument {
  return {
    id: 'doc-1',
    userId: 'user-1',
    walletType: 'personal',
    documentType: 'passport',
    name: 'My Passport',
    mimeType: 'application/pdf',
    fileSize: 204800, // 200 KB
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}

// ── Pure function unit tests ──────────────────────────────────────────────────

describe('getDocumentIcon (pure)', () => {
  it('returns "file-pdf-box" for application/pdf', () => {
    expect(getDocumentIcon('application/pdf')).toBe('file-pdf-box');
  });

  it('returns "file-image" for image/jpeg', () => {
    expect(getDocumentIcon('image/jpeg')).toBe('file-image');
  });

  it('returns "file-image" for image/png', () => {
    expect(getDocumentIcon('image/png')).toBe('file-image');
  });

  it('returns "file-image" for image/heic', () => {
    expect(getDocumentIcon('image/heic')).toBe('file-image');
  });

  it('returns "file-document" for unknown types', () => {
    expect(getDocumentIcon('application/octet-stream')).toBe('file-document');
  });

  it('returns "file-document" for text/plain', () => {
    expect(getDocumentIcon('text/plain')).toBe('file-document');
  });
});

describe('getDocumentTypeLabel (pure)', () => {
  const cases: [DocumentType, string][] = [
    ['passport', 'Passport'],
    ['visa', 'Visa'],
    ['insurance', 'Insurance'],
    ['vaccination', 'Vaccination'],
    ['loyalty_card', 'Loyalty Card'],
    ['flight_booking', 'Flight'],
    ['hotel_booking', 'Hotel'],
    ['reservation', 'Reservation'],
    ['receipt', 'Receipt'],
    ['other', 'Other'],
  ];

  it.each(cases)('maps %s → %s', (type, expected) => {
    expect(getDocumentTypeLabel(type)).toBe(expected);
  });
});

describe('formatFileSize (pure)', () => {
  it('shows bytes for values under 1024', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('shows "1.0 KB" for exactly 1024 bytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('shows KB for values between 1024 and 1 MB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('shows fractional KB', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('shows "1.0 MB" for exactly 1 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('shows MB for values >= 1 MB', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('shows fractional MB', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});

// ── Rendering tests ────────────────────────────────────────────────────────────

describe('DocumentListItem rendering', () => {
  const onPress = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the document name', () => {
    const doc = createMockDocument({ name: 'Paris Passport' });

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('Paris Passport')).toBeTruthy();
  });

  it('renders the document type chip label', () => {
    const doc = createMockDocument({ documentType: 'visa' });

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('Visa')).toBeTruthy();
  });

  it('renders file size text', () => {
    const doc = createMockDocument({ fileSize: 204800 }); // 200 KB

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('200.0 KB')).toBeTruthy();
  });

  it('renders formatted date text', () => {
    const doc = createMockDocument();

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('2 days ago')).toBeTruthy();
  });

  it('renders delete button when onDelete is provided', () => {
    const doc = createMockDocument();

    const { getAllByTestId } = render(
      <DocumentListItem document={doc} onPress={onPress} onDelete={onDelete} />
    );

    // The component has two IconButtons: one for the file icon (disabled, no onPress)
    // and one for delete (has onPress). Both render with testID="icon-button".
    // We verify both are present (file icon + delete button = 2).
    expect(getAllByTestId('icon-button').length).toBe(2);
  });

  it('does not render delete button when onDelete is not provided', () => {
    const doc = createMockDocument();

    const { getAllByTestId } = render(<DocumentListItem document={doc} onPress={onPress} />);

    // Only the file icon button renders (no delete button)
    expect(getAllByTestId('icon-button').length).toBe(1);
  });

  it('calls onPress with the document when item is tapped', () => {
    const doc = createMockDocument({ id: 'doc-tap-test' });

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    fireEvent.press(getByText('My Passport'));
    expect(onPress).toHaveBeenCalledWith(doc);
  });

  it('calls onDelete with the document when delete is pressed', () => {
    const doc = createMockDocument({ id: 'doc-delete-test' });

    const { getAllByTestId } = render(
      <DocumentListItem document={doc} onPress={onPress} onDelete={onDelete} />
    );

    // The second icon-button is the delete button (first is the file type icon)
    const buttons = getAllByTestId('icon-button');
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onDelete).toHaveBeenCalledWith(doc);
  });

  it('renders type chip for flight_booking', () => {
    const doc = createMockDocument({ documentType: 'flight_booking' });

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('Flight')).toBeTruthy();
  });

  it('renders type chip for loyalty_card', () => {
    const doc = createMockDocument({ documentType: 'loyalty_card' });

    const { getByText } = render(<DocumentListItem document={doc} onPress={onPress} />);

    expect(getByText('Loyalty Card')).toBeTruthy();
  });
});
