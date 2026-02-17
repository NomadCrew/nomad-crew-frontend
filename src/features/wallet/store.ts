// src/features/wallet/store.ts
// Zustand store for wallet document management — uses Go backend API

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WalletDocument, DocumentType, CreateDocumentInput, UpdateDocumentInput } from './types';
import { walletApi } from './api';
import { shouldCompress, compressImage, MAX_FILE_SIZE } from './services';
import * as FileSystem from 'expo-file-system';
import { logger } from '@/src/utils/logger';
import { registerStoreReset } from '@/src/utils/store-reset';

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
  fetchPersonalDocuments: () => Promise<void>;
  getPersonalDocumentsByType: (type: DocumentType) => WalletDocument[];

  // Actions - Group Wallet
  fetchGroupDocuments: (tripId: string) => Promise<void>;
  getGroupDocuments: (tripId: string) => WalletDocument[];

  // Actions - CRUD
  updateDocument: (id: string, input: UpdateDocumentInput) => Promise<WalletDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Actions - Selection
  setSelectedDocument: (document: WalletDocument | null) => void;

  // Actions - Upload
  uploadDocument: (input: CreateDocumentInput) => Promise<WalletDocument>;
  cancelUpload: () => void;

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

      fetchPersonalDocuments: async () => {
        set({ personalLoading: true, personalError: null });
        logger.info('WALLET', 'fetchPersonalDocuments started');

        try {
          const response = await walletApi.listPersonal();
          set({ personalDocuments: response.data, personalLoading: false });
          logger.info('WALLET', 'fetchPersonalDocuments completed', {
            count: response.data.length,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch personal documents';
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

      fetchGroupDocuments: async (tripId: string) => {
        set({ groupLoading: true, groupError: null });
        logger.info('WALLET', 'fetchGroupDocuments started', { tripId });

        try {
          const response = await walletApi.listGroup(tripId);
          set((state) => ({
            groupDocuments: { ...state.groupDocuments, [tripId]: response.data },
            groupLoading: false,
          }));
          logger.info('WALLET', 'fetchGroupDocuments completed', {
            tripId,
            count: response.data.length,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch group documents';
          logger.error('WALLET', 'fetchGroupDocuments error:', message);
          set({ groupError: message, groupLoading: false });
          throw error;
        }
      },

      getGroupDocuments: (tripId: string) => {
        return get().groupDocuments[tripId] || [];
      },

      // ==========================================
      // CRUD Actions
      // ==========================================

      updateDocument: async (id: string, input: UpdateDocumentInput) => {
        logger.info('WALLET', 'updateDocument started', { id });

        try {
          const document = await walletApi.updateDocument(id, input);

          // Update in state
          const updateInArray = (docs: WalletDocument[]) =>
            docs.map((doc) => (doc.id === id ? document : doc));

          set((state) => ({
            personalDocuments: updateInArray(state.personalDocuments),
            groupDocuments: Object.fromEntries(
              Object.entries(state.groupDocuments).map(([tripId, docs]) => [
                tripId,
                updateInArray(docs),
              ])
            ),
            selectedDocument: state.selectedDocument?.id === id ? document : state.selectedDocument,
          }));

          logger.info('WALLET', 'updateDocument completed', { id });
          return document;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update document';
          logger.error('WALLET', 'updateDocument error:', message);
          throw error;
        }
      },

      deleteDocument: async (id: string) => {
        logger.info('WALLET', 'deleteDocument started', { id });

        try {
          await walletApi.deleteDocument(id);

          // Remove from state
          const filterOut = (docs: WalletDocument[]) => docs.filter((doc) => doc.id !== id);

          set((state) => ({
            personalDocuments: filterOut(state.personalDocuments),
            groupDocuments: Object.fromEntries(
              Object.entries(state.groupDocuments).map(([tripId, docs]) => [
                tripId,
                filterOut(docs),
              ])
            ),
            selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
          }));

          logger.info('WALLET', 'deleteDocument completed', { id });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete document';
          logger.error('WALLET', 'deleteDocument error:', message);
          throw error;
        }
      },

      // ==========================================
      // Selection Actions
      // ==========================================

      setSelectedDocument: (document: WalletDocument | null) => {
        set({ selectedDocument: document });
      },

      // ==========================================
      // Upload Actions (with progress tracking)
      // ==========================================

      uploadDocument: async (input: CreateDocumentInput) => {
        logger.info('WALLET', 'uploadDocument started', { name: input.name });
        set({ uploadProgress: 0, uploadError: null });

        try {
          // Validate group wallet has tripId
          if (input.walletType === 'group' && !input.tripId) {
            throw new Error('tripId is required for group wallet documents');
          }

          // Prepare file URI - compress if image
          let fileUri = input.fileUri;
          let mimeType = input.mimeType;
          if (shouldCompress(input.mimeType)) {
            logger.info('WALLET', 'Compressing image');
            fileUri = await compressImage(input.fileUri);
            mimeType = 'image/jpeg'; // Compressed images are JPEG
          }

          // Check file size without consuming the file stream
          const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
          if (!fileInfo.exists) {
            throw new Error('Selected file no longer exists or is not accessible');
          }
          const fileSize = fileInfo.size ?? 0;

          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(
              `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`
            );
          }

          // Native progress callback from FileSystem.createUploadTask
          const onProgress = ({
            totalBytesSent,
            totalBytesExpectedToSend,
          }: {
            totalBytesSent: number;
            totalBytesExpectedToSend: number;
          }) => {
            const pct =
              totalBytesExpectedToSend > 0
                ? Math.round((totalBytesSent / totalBytesExpectedToSend) * 100)
                : 0;
            set({ uploadProgress: pct });
          };

          // Upload via native multipart (expo-file-system)
          const uploadInput = { ...input, mimeType };
          let document: WalletDocument;

          if (input.walletType === 'group' && input.tripId) {
            document = await walletApi.uploadGroup(input.tripId, uploadInput, fileUri, onProgress);
          } else {
            document = await walletApi.uploadPersonal(uploadInput, fileUri, onProgress);
          }

          set({ uploadProgress: 100 });

          // Add to appropriate state
          if (input.walletType === 'personal') {
            set((state) => ({
              personalDocuments: [document, ...state.personalDocuments],
            }));
          } else if (input.tripId) {
            set((state) => ({
              groupDocuments: {
                ...state.groupDocuments,
                [input.tripId!]: [document, ...(state.groupDocuments[input.tripId!] || [])],
              },
            }));
          }

          // Clear progress after short delay
          setTimeout(() => {
            set({ uploadProgress: null });
          }, 500);

          logger.info('WALLET', 'uploadDocument completed', { id: document.id });
          return document;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to upload document';
          logger.error('WALLET', 'uploadDocument error:', message);
          set({ uploadError: message, uploadProgress: null });
          throw error;
        }
      },

      cancelUpload: () => {
        set({ uploadProgress: null, uploadError: null });
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

registerStoreReset('WalletStore', () => useWalletStore.getState().reset());

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
export const useUploadError = () => useWalletStore((state) => state.uploadError);
