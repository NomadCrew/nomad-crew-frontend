/**
 * @jest-environment jsdom
 */

// Mock auth service FIRST to avoid env-var errors at module load time
jest.mock('@/src/features/auth/service', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
  refreshSupabaseSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  registerPushTokenService: jest.fn(),
  deregisterPushTokenService: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// Mock the wallet API module
jest.mock('@/src/features/wallet/api', () => ({
  walletApi: {
    listPersonal: jest.fn(),
    listGroup: jest.fn(),
    uploadPersonal: jest.fn(),
    uploadGroup: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    getDocument: jest.fn(),
  },
}));

// Mock wallet services (compression)
jest.mock('@/src/features/wallet/services', () => ({
  shouldCompress: jest.fn(() => false),
  compressImage: jest.fn((uri: string) => Promise.resolve(uri)),
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { act } from '@testing-library/react-native';
import { useWalletStore } from '@/src/features/wallet/store';
import { walletApi } from '@/src/features/wallet/api';
import { shouldCompress, compressImage } from '@/src/features/wallet/services';
import type {
  WalletDocument,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@/src/features/wallet/types';

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

function makePaginatedResponse(docs: WalletDocument[]) {
  return { data: docs, pagination: { limit: 50, offset: 0, total: docs.length } };
}

function makePersonalInput(overrides: Partial<CreateDocumentInput> = {}): CreateDocumentInput {
  return {
    walletType: 'personal',
    documentType: 'passport',
    name: 'My Passport',
    fileUri: 'file:///tmp/passport.jpg',
    mimeType: 'image/jpeg',
    ...overrides,
  };
}

// Mock global fetch for file size checks in uploadDocument
global.fetch = jest.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(512000)), // 500 KB
  } as Response)
);

describe('useWalletStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWalletStore.getState().reset();
    // Default: fetch returns a small file (500 KB, well under 10 MB limit)
    (global.fetch as jest.Mock).mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(512000)),
    });
  });

  // ==========================================
  // fetchPersonalDocuments
  // ==========================================

  describe('fetchPersonalDocuments', () => {
    it('should fetch and store personal documents on success', async () => {
      const doc = makeDocument();
      (walletApi.listPersonal as jest.Mock).mockResolvedValue(makePaginatedResponse([doc]));

      await act(async () => {
        await useWalletStore.getState().fetchPersonalDocuments();
      });

      const state = useWalletStore.getState();
      expect(state.personalDocuments).toHaveLength(1);
      expect(state.personalDocuments[0].id).toBe('doc-001');
      expect(state.personalLoading).toBe(false);
      expect(state.personalError).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      (walletApi.listPersonal as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(makePaginatedResponse([])), 100))
      );

      const fetchPromise = useWalletStore.getState().fetchPersonalDocuments();
      expect(useWalletStore.getState().personalLoading).toBe(true);

      await act(async () => {
        await fetchPromise;
      });
      expect(useWalletStore.getState().personalLoading).toBe(false);
    });

    it('should set personalError and rethrow on failure', async () => {
      (walletApi.listPersonal as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(useWalletStore.getState().fetchPersonalDocuments()).rejects.toThrow(
        'Network error'
      );
      const state = useWalletStore.getState();
      expect(state.personalError).toBe('Network error');
      expect(state.personalLoading).toBe(false);
    });
  });

  // ==========================================
  // fetchGroupDocuments
  // ==========================================

  describe('fetchGroupDocuments', () => {
    it('should fetch and merge group documents by tripId', async () => {
      const doc1 = makeDocument({ id: 'doc-g1', walletType: 'group', tripId: 'trip-A' });
      const doc2 = makeDocument({ id: 'doc-g2', walletType: 'group', tripId: 'trip-B' });

      (walletApi.listGroup as jest.Mock)
        .mockResolvedValueOnce(makePaginatedResponse([doc1]))
        .mockResolvedValueOnce(makePaginatedResponse([doc2]));

      await act(async () => {
        await useWalletStore.getState().fetchGroupDocuments('trip-A');
      });
      await act(async () => {
        await useWalletStore.getState().fetchGroupDocuments('trip-B');
      });

      const state = useWalletStore.getState();
      expect(state.groupDocuments['trip-A']).toHaveLength(1);
      expect(state.groupDocuments['trip-A'][0].id).toBe('doc-g1');
      expect(state.groupDocuments['trip-B']).toHaveLength(1);
      expect(state.groupDocuments['trip-B'][0].id).toBe('doc-g2');
    });

    it('should set loading state during fetch', async () => {
      (walletApi.listGroup as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(makePaginatedResponse([])), 100))
      );

      const fetchPromise = useWalletStore.getState().fetchGroupDocuments('trip-A');
      expect(useWalletStore.getState().groupLoading).toBe(true);

      await act(async () => {
        await fetchPromise;
      });
      expect(useWalletStore.getState().groupLoading).toBe(false);
    });

    it('should set groupError and rethrow on failure', async () => {
      (walletApi.listGroup as jest.Mock).mockRejectedValue(new Error('Group fetch failed'));

      await expect(useWalletStore.getState().fetchGroupDocuments('trip-A')).rejects.toThrow(
        'Group fetch failed'
      );
      const state = useWalletStore.getState();
      expect(state.groupError).toBe('Group fetch failed');
      expect(state.groupLoading).toBe(false);
    });
  });

  // ==========================================
  // getPersonalDocumentsByType
  // ==========================================

  describe('getPersonalDocumentsByType', () => {
    beforeEach(() => {
      useWalletStore.setState({
        personalDocuments: [
          makeDocument({ id: 'doc-p1', documentType: 'passport' }),
          makeDocument({ id: 'doc-v1', documentType: 'visa' }),
          makeDocument({ id: 'doc-p2', documentType: 'passport' }),
        ],
      });
    });

    it('should filter personal documents by type', () => {
      const passports = useWalletStore.getState().getPersonalDocumentsByType('passport');
      expect(passports).toHaveLength(2);
      expect(passports.every((d) => d.documentType === 'passport')).toBe(true);
    });

    it('should return empty array for type with no documents', () => {
      const receipts = useWalletStore.getState().getPersonalDocumentsByType('receipt');
      expect(receipts).toHaveLength(0);
    });
  });

  // ==========================================
  // getGroupDocuments
  // ==========================================

  describe('getGroupDocuments', () => {
    it('should return documents for the specified tripId', () => {
      const doc = makeDocument({ id: 'doc-g1', walletType: 'group', tripId: 'trip-A' });
      useWalletStore.setState({ groupDocuments: { 'trip-A': [doc] } });

      const docs = useWalletStore.getState().getGroupDocuments('trip-A');
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('doc-g1');
    });

    it('should return empty array for unknown tripId', () => {
      const docs = useWalletStore.getState().getGroupDocuments('unknown-trip');
      expect(docs).toHaveLength(0);
    });
  });

  // ==========================================
  // uploadDocument — personal
  // ==========================================

  describe('uploadDocument (personal)', () => {
    it('should upload and prepend to personalDocuments', async () => {
      const existing = makeDocument({ id: 'doc-old' });
      useWalletStore.setState({ personalDocuments: [existing] });

      const newDoc = makeDocument({ id: 'doc-new', name: 'New Doc' });
      (walletApi.uploadPersonal as jest.Mock).mockResolvedValue(newDoc);

      await act(async () => {
        await useWalletStore.getState().uploadDocument(makePersonalInput());
      });

      const docs = useWalletStore.getState().personalDocuments;
      expect(docs[0].id).toBe('doc-new');
      expect(docs[1].id).toBe('doc-old');
    });

    it('should set uploadProgress stages and resolve to 100', async () => {
      const newDoc = makeDocument({ id: 'doc-new' });
      (walletApi.uploadPersonal as jest.Mock).mockResolvedValue(newDoc);

      const progressValues: (number | null)[] = [];
      const unsubscribe = useWalletStore.subscribe((state) => {
        progressValues.push(state.uploadProgress);
      });

      await act(async () => {
        await useWalletStore.getState().uploadDocument(makePersonalInput());
      });

      unsubscribe();
      expect(progressValues).toContain(0);
      expect(progressValues).toContain(100);
    });

    it('should compress images when shouldCompress returns true', async () => {
      (shouldCompress as jest.Mock).mockReturnValue(true);
      (compressImage as jest.Mock).mockResolvedValue('file:///tmp/compressed.jpg');

      const newDoc = makeDocument({ id: 'doc-compressed' });
      (walletApi.uploadPersonal as jest.Mock).mockResolvedValue(newDoc);

      await act(async () => {
        await useWalletStore
          .getState()
          .uploadDocument(
            makePersonalInput({ fileUri: 'file:///tmp/original.jpg', mimeType: 'image/jpeg' })
          );
      });

      expect(compressImage).toHaveBeenCalledWith('file:///tmp/original.jpg');
      // uploadPersonal should be called with the compressed URI
      expect(walletApi.uploadPersonal).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/jpeg' }),
        'file:///tmp/compressed.jpg'
      );
    });

    it('should reject oversized files', async () => {
      // 11 MB > 10 MB limit
      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(11 * 1024 * 1024)),
      });

      await expect(useWalletStore.getState().uploadDocument(makePersonalInput())).rejects.toThrow(
        /exceeds maximum/
      );

      const state = useWalletStore.getState();
      expect(state.uploadError).toMatch(/exceeds maximum/);
      expect(state.uploadProgress).toBeNull();
    });

    it('should set uploadError and rethrow on API failure', async () => {
      (walletApi.uploadPersonal as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await expect(useWalletStore.getState().uploadDocument(makePersonalInput())).rejects.toThrow(
        'Upload failed'
      );

      const state = useWalletStore.getState();
      expect(state.uploadError).toBe('Upload failed');
      expect(state.uploadProgress).toBeNull();
    });
  });

  // ==========================================
  // uploadDocument — group
  // ==========================================

  describe('uploadDocument (group)', () => {
    it('should throw if tripId is missing for group wallet', async () => {
      const input = makePersonalInput({ walletType: 'group', tripId: undefined });

      await expect(useWalletStore.getState().uploadDocument(input)).rejects.toThrow(
        'tripId is required for group wallet documents'
      );
    });

    it('should upload and prepend to the correct tripId bucket', async () => {
      const existing = makeDocument({ id: 'doc-old', walletType: 'group', tripId: 'trip-A' });
      useWalletStore.setState({ groupDocuments: { 'trip-A': [existing] } });

      const newDoc = makeDocument({ id: 'doc-new', walletType: 'group', tripId: 'trip-A' });
      (walletApi.uploadGroup as jest.Mock).mockResolvedValue(newDoc);

      await act(async () => {
        await useWalletStore
          .getState()
          .uploadDocument(makePersonalInput({ walletType: 'group', tripId: 'trip-A' }));
      });

      const docs = useWalletStore.getState().groupDocuments['trip-A'];
      expect(docs[0].id).toBe('doc-new');
      expect(docs[1].id).toBe('doc-old');
    });

    it('should not affect other tripId buckets', async () => {
      const otherDoc = makeDocument({ id: 'doc-other', walletType: 'group', tripId: 'trip-B' });
      useWalletStore.setState({ groupDocuments: { 'trip-B': [otherDoc] } });

      const newDoc = makeDocument({ id: 'doc-new', walletType: 'group', tripId: 'trip-A' });
      (walletApi.uploadGroup as jest.Mock).mockResolvedValue(newDoc);

      await act(async () => {
        await useWalletStore
          .getState()
          .uploadDocument(makePersonalInput({ walletType: 'group', tripId: 'trip-A' }));
      });

      expect(useWalletStore.getState().groupDocuments['trip-B']).toHaveLength(1);
      expect(useWalletStore.getState().groupDocuments['trip-B'][0].id).toBe('doc-other');
    });
  });

  // ==========================================
  // updateDocument
  // ==========================================

  describe('updateDocument', () => {
    const existingDoc = makeDocument({ id: 'doc-001', name: 'Old Name' });

    it('should update document in personalDocuments', async () => {
      useWalletStore.setState({ personalDocuments: [existingDoc] });
      const updatedDoc = { ...existingDoc, name: 'New Name' };
      (walletApi.updateDocument as jest.Mock).mockResolvedValue(updatedDoc);

      await act(async () => {
        await useWalletStore.getState().updateDocument('doc-001', { name: 'New Name' });
      });

      expect(useWalletStore.getState().personalDocuments[0].name).toBe('New Name');
    });

    it('should update document in groupDocuments', async () => {
      const groupDoc = makeDocument({
        id: 'doc-g1',
        walletType: 'group',
        tripId: 'trip-A',
        name: 'Old',
      });
      useWalletStore.setState({ groupDocuments: { 'trip-A': [groupDoc] } });

      const updatedGroupDoc = { ...groupDoc, name: 'Updated' };
      (walletApi.updateDocument as jest.Mock).mockResolvedValue(updatedGroupDoc);

      await act(async () => {
        await useWalletStore.getState().updateDocument('doc-g1', { name: 'Updated' });
      });

      expect(useWalletStore.getState().groupDocuments['trip-A'][0].name).toBe('Updated');
    });

    it('should update selectedDocument if it matches the id', async () => {
      useWalletStore.setState({
        personalDocuments: [existingDoc],
        selectedDocument: existingDoc,
      });
      const updatedDoc = { ...existingDoc, name: 'New Name' };
      (walletApi.updateDocument as jest.Mock).mockResolvedValue(updatedDoc);

      await act(async () => {
        await useWalletStore.getState().updateDocument('doc-001', { name: 'New Name' });
      });

      expect(useWalletStore.getState().selectedDocument?.name).toBe('New Name');
    });

    it('should not change selectedDocument if id does not match', async () => {
      const otherDoc = makeDocument({ id: 'doc-other' });
      useWalletStore.setState({
        personalDocuments: [existingDoc, otherDoc],
        selectedDocument: otherDoc,
      });
      const updatedDoc = { ...existingDoc, name: 'New Name' };
      (walletApi.updateDocument as jest.Mock).mockResolvedValue(updatedDoc);

      await act(async () => {
        await useWalletStore.getState().updateDocument('doc-001', { name: 'New Name' });
      });

      expect(useWalletStore.getState().selectedDocument?.id).toBe('doc-other');
    });

    it('should rethrow on failure', async () => {
      useWalletStore.setState({ personalDocuments: [existingDoc] });
      (walletApi.updateDocument as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        useWalletStore.getState().updateDocument('doc-001', { name: 'X' })
      ).rejects.toThrow('Update failed');
    });
  });

  // ==========================================
  // deleteDocument
  // ==========================================

  describe('deleteDocument', () => {
    it('should remove document from personalDocuments', async () => {
      const doc1 = makeDocument({ id: 'doc-001' });
      const doc2 = makeDocument({ id: 'doc-002' });
      useWalletStore.setState({ personalDocuments: [doc1, doc2] });
      (walletApi.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useWalletStore.getState().deleteDocument('doc-001');
      });

      const docs = useWalletStore.getState().personalDocuments;
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('doc-002');
    });

    it('should remove document from groupDocuments', async () => {
      const groupDoc1 = makeDocument({ id: 'doc-g1', walletType: 'group', tripId: 'trip-A' });
      const groupDoc2 = makeDocument({ id: 'doc-g2', walletType: 'group', tripId: 'trip-A' });
      useWalletStore.setState({ groupDocuments: { 'trip-A': [groupDoc1, groupDoc2] } });
      (walletApi.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useWalletStore.getState().deleteDocument('doc-g1');
      });

      const docs = useWalletStore.getState().groupDocuments['trip-A'];
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('doc-g2');
    });

    it('should clear selectedDocument if it matches the deleted id', async () => {
      const doc = makeDocument({ id: 'doc-001' });
      useWalletStore.setState({ personalDocuments: [doc], selectedDocument: doc });
      (walletApi.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useWalletStore.getState().deleteDocument('doc-001');
      });

      expect(useWalletStore.getState().selectedDocument).toBeNull();
    });

    it('should not clear selectedDocument if a different doc is deleted', async () => {
      const doc1 = makeDocument({ id: 'doc-001' });
      const doc2 = makeDocument({ id: 'doc-002' });
      useWalletStore.setState({ personalDocuments: [doc1, doc2], selectedDocument: doc2 });
      (walletApi.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useWalletStore.getState().deleteDocument('doc-001');
      });

      expect(useWalletStore.getState().selectedDocument?.id).toBe('doc-002');
    });

    it('should rethrow on failure', async () => {
      (walletApi.deleteDocument as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(useWalletStore.getState().deleteDocument('doc-001')).rejects.toThrow(
        'Not found'
      );
    });
  });

  // ==========================================
  // setSelectedDocument
  // ==========================================

  describe('setSelectedDocument', () => {
    it('should set the selected document', () => {
      const doc = makeDocument();
      useWalletStore.getState().setSelectedDocument(doc);
      expect(useWalletStore.getState().selectedDocument?.id).toBe('doc-001');
    });

    it('should clear selected document when set to null', () => {
      useWalletStore.setState({ selectedDocument: makeDocument() });
      useWalletStore.getState().setSelectedDocument(null);
      expect(useWalletStore.getState().selectedDocument).toBeNull();
    });
  });

  // ==========================================
  // clearError
  // ==========================================

  describe('clearError', () => {
    it('should clear all error fields', () => {
      useWalletStore.setState({
        personalError: 'personal err',
        groupError: 'group err',
        uploadError: 'upload err',
      });

      useWalletStore.getState().clearError();

      const state = useWalletStore.getState();
      expect(state.personalError).toBeNull();
      expect(state.groupError).toBeNull();
      expect(state.uploadError).toBeNull();
    });
  });

  // ==========================================
  // reset
  // ==========================================

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      const doc = makeDocument();
      useWalletStore.setState({
        personalDocuments: [doc],
        groupDocuments: { 'trip-A': [doc] },
        selectedDocument: doc,
        uploadProgress: 50,
        uploadError: 'oops',
        personalError: 'err1',
        groupError: 'err2',
        personalLoading: true,
        groupLoading: true,
      });

      useWalletStore.getState().reset();

      const state = useWalletStore.getState();
      expect(state.personalDocuments).toHaveLength(0);
      expect(state.groupDocuments).toEqual({});
      expect(state.selectedDocument).toBeNull();
      expect(state.uploadProgress).toBeNull();
      expect(state.uploadError).toBeNull();
      expect(state.personalError).toBeNull();
      expect(state.groupError).toBeNull();
      expect(state.personalLoading).toBe(false);
      expect(state.groupLoading).toBe(false);
    });
  });
});
