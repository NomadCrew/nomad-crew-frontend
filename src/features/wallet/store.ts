// src/features/wallet/store.ts
// Zustand store for wallet document management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  WalletDocument,
  DocumentType,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from './types';
import { logger } from '@/src/utils/logger';

/**
 * Wallet store state interface
 */
interface WalletState {
  // Personal wallet state
  personalDocuments: WalletDocument[];
  personalLoading: boolean;
  personalError: string | null;

  // Group wallet state (per trip)
  groupDocuments: Record<string, WalletDocument[]>; // tripId -> documents
  groupLoading: boolean;
  groupError: string | null;

  // Selected document (for viewing/editing)
  selectedDocument: WalletDocument | null;

  // Upload state
  uploadProgress: number | null;
  uploadError: string | null;

  // Actions - Personal Wallet
  fetchPersonalDocuments: (filters?: DocumentFilters) => Promise<void>;
  getPersonalDocumentsByType: (type: DocumentType) => WalletDocument[];

  // Actions - Group Wallet
  fetchGroupDocuments: (tripId: string, filters?: DocumentFilters) => Promise<void>;
  getGroupDocuments: (tripId: string) => WalletDocument[];

  // Actions - CRUD (implemented in Phase 2)
  createDocument: (input: CreateDocumentInput) => Promise<WalletDocument>;
  updateDocument: (id: string, input: UpdateDocumentInput) => Promise<WalletDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Actions - Selection
  setSelectedDocument: (document: WalletDocument | null) => void;

  // Actions - Upload (implemented in Phase 2)
  uploadDocument: (input: CreateDocumentInput) => Promise<WalletDocument>;
  cancelUpload: () => void;

  // Real-time event handling
  handleDocumentEvent: (event: unknown) => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial state values
 */
const initialState = {
  personalDocuments: [] as WalletDocument[],
  personalLoading: false,
  personalError: null as string | null,
  groupDocuments: {} as Record<string, WalletDocument[]>,
  groupLoading: false,
  groupError: null as string | null,
  selectedDocument: null as WalletDocument | null,
  uploadProgress: null as number | null,
  uploadError: null as string | null,
};

/**
 * Wallet store implementation
 */
export const useWalletStore = create<WalletState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ==========================================
      // Personal Wallet Actions
      // ==========================================

      fetchPersonalDocuments: async (filters?: DocumentFilters) => {
        set({ personalLoading: true, personalError: null });
        logger.info('WALLET', 'fetchPersonalDocuments started', { filters });

        try {
          // TODO: Implement API call in Phase 2
          // const response = await api.get(API_PATHS.wallet.personal, { params: filters });
          // const documents = normalizeDocuments(response.data);
          // set({ personalDocuments: documents, personalLoading: false });

          // Placeholder - remove in Phase 2
          set({ personalDocuments: [], personalLoading: false });
          logger.info('WALLET', 'fetchPersonalDocuments completed (placeholder)');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch personal documents';
          logger.error('WALLET', 'fetchPersonalDocuments error:', message);
          set({ personalError: message, personalLoading: false });
          throw error;
        }
      },

      getPersonalDocumentsByType: (type: DocumentType) => {
        return get().personalDocuments.filter((doc) => doc.documentType === type);
      },

      // ==========================================
      // Group Wallet Actions
      // ==========================================

      fetchGroupDocuments: async (tripId: string, filters?: DocumentFilters) => {
        set({ groupLoading: true, groupError: null });
        logger.info('WALLET', 'fetchGroupDocuments started', { tripId, filters });

        try {
          // TODO: Implement API call in Phase 2
          // const response = await api.get(API_PATHS.wallet.group(tripId), { params: filters });
          // const documents = normalizeDocuments(response.data);
          // set((state) => ({
          //   groupDocuments: { ...state.groupDocuments, [tripId]: documents },
          //   groupLoading: false,
          // }));

          // Placeholder - remove in Phase 2
          set((state) => ({
            groupDocuments: { ...state.groupDocuments, [tripId]: [] },
            groupLoading: false,
          }));
          logger.info('WALLET', 'fetchGroupDocuments completed (placeholder)', { tripId });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch group documents';
          logger.error('WALLET', 'fetchGroupDocuments error:', message);
          set({ groupError: message, groupLoading: false });
          throw error;
        }
      },

      getGroupDocuments: (tripId: string) => {
        return get().groupDocuments[tripId] || [];
      },

      // ==========================================
      // CRUD Actions (Placeholder - Phase 2)
      // ==========================================

      createDocument: async (_input: CreateDocumentInput) => {
        // TODO: Implement in Phase 2
        logger.warn('WALLET', 'createDocument not yet implemented');
        throw new Error('Not implemented');
      },

      updateDocument: async (_id: string, _input: UpdateDocumentInput) => {
        // TODO: Implement in Phase 2
        logger.warn('WALLET', 'updateDocument not yet implemented');
        throw new Error('Not implemented');
      },

      deleteDocument: async (_id: string) => {
        // TODO: Implement in Phase 2
        logger.warn('WALLET', 'deleteDocument not yet implemented');
        throw new Error('Not implemented');
      },

      // ==========================================
      // Selection Actions
      // ==========================================

      setSelectedDocument: (document: WalletDocument | null) => {
        set({ selectedDocument: document });
      },

      // ==========================================
      // Upload Actions (Placeholder - Phase 2)
      // ==========================================

      uploadDocument: async (_input: CreateDocumentInput) => {
        // TODO: Implement in Phase 2
        logger.warn('WALLET', 'uploadDocument not yet implemented');
        throw new Error('Not implemented');
      },

      cancelUpload: () => {
        // TODO: Implement upload cancellation in Phase 2
        set({ uploadProgress: null, uploadError: null });
      },

      // ==========================================
      // Real-time Event Handling
      // ==========================================

      handleDocumentEvent: (event: unknown) => {
        // TODO: Implement event handling for real-time updates
        logger.info('WALLET', 'Document event received', { event });
      },

      // ==========================================
      // Utility Actions
      // ==========================================

      clearError: () => {
        set({ personalError: null, groupError: null, uploadError: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'WalletStore' }
  )
);

/**
 * Selector hooks for common queries
 */
export const usePersonalDocuments = () => useWalletStore((state) => state.personalDocuments);
export const useGroupDocuments = (tripId: string) =>
  useWalletStore((state) => state.groupDocuments[tripId] || []);
export const useWalletLoading = () =>
  useWalletStore((state) => state.personalLoading || state.groupLoading);
export const useWalletError = () =>
  useWalletStore((state) => state.personalError || state.groupError);
export const useSelectedDocument = () => useWalletStore((state) => state.selectedDocument);
export const useUploadProgress = () => useWalletStore((state) => state.uploadProgress);
