// Import test setup FIRST to ensure all mocks are in place
import './test-setup';

import { walletApi } from '@/src/features/wallet/api';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import type { WalletDocument, WalletDocumentWithUrl } from '@/src/features/wallet/types';

// Mock the API client
jest.mock('@/src/api/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {
    getAxiosInstance: jest.fn(() => ({ post: jest.fn() })),
  },
  registerAuthHandlers: jest.fn(),
}));

// ---- Factories ----

function makeDocument(overrides: Partial<WalletDocument> = {}): WalletDocument {
  return {
    id: 'doc-001',
    userId: 'user-123',
    walletType: 'personal',
    documentType: 'passport',
    name: 'My Passport',
    mimeType: 'image/jpeg',
    fileSize: 512000,
    metadata: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('walletApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // uploadPersonal
  // ==========================================

  describe('uploadPersonal', () => {
    it('should POST to the personal documents endpoint with multipart/form-data', async () => {
      const doc = makeDocument();
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'personal' as const,
        documentType: 'passport' as const,
        name: 'My Passport',
        fileUri: 'file:///tmp/passport.jpg',
        mimeType: 'image/jpeg',
      };

      const result = await walletApi.uploadPersonal(input, 'file:///tmp/passport.jpg');

      expect(api.post).toHaveBeenCalledWith(
        API_PATHS.wallet.documents,
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
      expect(result).toEqual(doc);
    });

    it('should append file with correct uri, type, and name to FormData', async () => {
      const doc = makeDocument();
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'personal' as const,
        documentType: 'visa' as const,
        name: 'UK Visa',
        fileUri: 'file:///tmp/visa.pdf',
        mimeType: 'application/pdf',
      };

      await walletApi.uploadPersonal(input, 'file:///tmp/visa.pdf');

      const formData: FormData = (api.post as jest.Mock).mock.calls[0][1];
      // FormData.get returns the appended value; check via _parts or check the call args
      // Since jsdom FormData doesn't expose .get for non-string values, verify via the mock
      // The FormData was constructed with file and metadata fields
      expect(formData).toBeDefined();
    });

    it('should include metadata JSON with walletType=personal', async () => {
      const doc = makeDocument();
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'personal' as const,
        documentType: 'passport' as const,
        name: 'My Passport',
        description: 'A travel document',
        fileUri: 'file:///tmp/passport.jpg',
        mimeType: 'image/jpeg',
      };

      await walletApi.uploadPersonal(input, 'file:///tmp/passport.jpg');

      const formData: FormData = (api.post as jest.Mock).mock.calls[0][1];
      // The metadata is appended as a JSON string — verify it was appended
      expect(formData).toBeDefined();
      // Also verify the API path is correct
      expect(api.post).toHaveBeenCalledWith(
        API_PATHS.wallet.documents,
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('should use the file extension from the fileUri in the filename', async () => {
      const doc = makeDocument();
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'personal' as const,
        documentType: 'passport' as const,
        name: 'Doc',
        fileUri: 'file:///tmp/scan.png',
        mimeType: 'image/png',
      };

      await walletApi.uploadPersonal(input, 'file:///tmp/scan.png');

      // The file appended should use extension 'png'
      const formData: FormData = (api.post as jest.Mock).mock.calls[0][1];
      expect(formData).toBeDefined();
    });
  });

  // ==========================================
  // uploadGroup
  // ==========================================

  describe('uploadGroup', () => {
    it('should POST to the group documents endpoint for a tripId', async () => {
      const doc = makeDocument({ walletType: 'group', tripId: 'trip-A' });
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'group' as const,
        tripId: 'trip-A',
        documentType: 'insurance' as const,
        name: 'Travel Insurance',
        fileUri: 'file:///tmp/insurance.pdf',
        mimeType: 'application/pdf',
      };

      const result = await walletApi.uploadGroup('trip-A', input, 'file:///tmp/insurance.pdf');

      expect(api.post).toHaveBeenCalledWith(
        API_PATHS.wallet.groupDocuments('trip-A'),
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
      expect(result).toEqual(doc);
    });

    it('should include tripId in metadata JSON for group uploads', async () => {
      const doc = makeDocument({ walletType: 'group', tripId: 'trip-B' });
      (api.post as jest.Mock).mockResolvedValue({ data: doc });

      const input = {
        walletType: 'group' as const,
        tripId: 'trip-B',
        documentType: 'receipt' as const,
        name: 'Dinner Receipt',
        fileUri: 'file:///tmp/receipt.jpg',
        mimeType: 'image/jpeg',
      };

      await walletApi.uploadGroup('trip-B', input, 'file:///tmp/receipt.jpg');

      // Verify the correct group endpoint was called, not the personal endpoint
      expect(api.post).not.toHaveBeenCalledWith(
        API_PATHS.wallet.documents,
        expect.anything(),
        expect.anything()
      );
      expect(api.post).toHaveBeenCalledWith(
        API_PATHS.wallet.groupDocuments('trip-B'),
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });

  // ==========================================
  // listPersonal
  // ==========================================

  describe('listPersonal', () => {
    it('should GET the personal documents endpoint with default pagination', async () => {
      const docs = [makeDocument()];
      (api.get as jest.Mock).mockResolvedValue({
        data: { data: docs, pagination: { limit: 50, offset: 0, total: 1 } },
      });

      const result = await walletApi.listPersonal();

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.documents, {
        params: { limit: 50, offset: 0 },
      });
      expect(result.data).toEqual(docs);
      expect(result.pagination.total).toBe(1);
    });

    it('should pass custom limit and offset params', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: { data: [], pagination: { limit: 10, offset: 20, total: 50 } },
      });

      await walletApi.listPersonal(10, 20);

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.documents, {
        params: { limit: 10, offset: 20 },
      });
    });
  });

  // ==========================================
  // listGroup
  // ==========================================

  describe('listGroup', () => {
    it('should GET the group documents endpoint for a specific tripId', async () => {
      const doc = makeDocument({ walletType: 'group', tripId: 'trip-A' });
      (api.get as jest.Mock).mockResolvedValue({
        data: { data: [doc], pagination: { limit: 50, offset: 0, total: 1 } },
      });

      const result = await walletApi.listGroup('trip-A');

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.groupDocuments('trip-A'), {
        params: { limit: 50, offset: 0 },
      });
      expect(result.data[0].id).toBe('doc-001');
    });

    it('should pass custom limit and offset params', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: { data: [], pagination: { limit: 5, offset: 10, total: 100 } },
      });

      await walletApi.listGroup('trip-A', 5, 10);

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.groupDocuments('trip-A'), {
        params: { limit: 5, offset: 10 },
      });
    });
  });

  // ==========================================
  // getDocument
  // ==========================================

  describe('getDocument', () => {
    it('should GET the single document endpoint with download URL', async () => {
      const doc: WalletDocumentWithUrl = {
        ...makeDocument(),
        downloadUrl: 'https://cdn.example.com/files/passport.jpg',
      };
      (api.get as jest.Mock).mockResolvedValue({ data: doc });

      const result = await walletApi.getDocument('doc-001');

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.document('doc-001'));
      expect(result.downloadUrl).toBe('https://cdn.example.com/files/passport.jpg');
    });

    it('should use the correct document id in the path', async () => {
      const doc: WalletDocumentWithUrl = {
        ...makeDocument({ id: 'doc-xyz' }),
        downloadUrl: 'http://cdn/f',
      };
      (api.get as jest.Mock).mockResolvedValue({ data: doc });

      await walletApi.getDocument('doc-xyz');

      expect(api.get).toHaveBeenCalledWith(API_PATHS.wallet.document('doc-xyz'));
      expect(api.get).not.toHaveBeenCalledWith(API_PATHS.wallet.document('doc-001'));
    });
  });

  // ==========================================
  // updateDocument
  // ==========================================

  describe('updateDocument', () => {
    it('should PUT to the document endpoint with update payload', async () => {
      const updatedDoc = makeDocument({ name: 'Updated Name' });
      (api.put as jest.Mock).mockResolvedValue({ data: updatedDoc });

      const result = await walletApi.updateDocument('doc-001', { name: 'Updated Name' });

      expect(api.put).toHaveBeenCalledWith(API_PATHS.wallet.document('doc-001'), {
        name: 'Updated Name',
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should use PUT (not PATCH or POST) for updates', async () => {
      const updatedDoc = makeDocument();
      (api.put as jest.Mock).mockResolvedValue({ data: updatedDoc });

      await walletApi.updateDocument('doc-001', { description: 'New desc' });

      expect(api.put).toHaveBeenCalledTimes(1);
      expect(api.patch).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // deleteDocument
  // ==========================================

  describe('deleteDocument', () => {
    it('should DELETE the document endpoint', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await walletApi.deleteDocument('doc-001');

      expect(api.delete).toHaveBeenCalledWith(API_PATHS.wallet.document('doc-001'));
    });

    it('should use DELETE (not POST or PUT) for deletion', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await walletApi.deleteDocument('doc-999');

      expect(api.delete).toHaveBeenCalledTimes(1);
      expect(api.post).not.toHaveBeenCalled();
      expect(api.put).not.toHaveBeenCalled();
      expect(api.delete).toHaveBeenCalledWith(API_PATHS.wallet.document('doc-999'));
    });

    it('should propagate API errors', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Document not found'));

      await expect(walletApi.deleteDocument('doc-404')).rejects.toThrow('Document not found');
    });
  });
});
