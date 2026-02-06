// src/features/wallet/store.ts
// Zustand store for wallet document management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  WalletDocument,
  WalletDocumentResponse,
  DocumentType,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from './types';
import {
  uploadDocument as uploadToStorage,
  getSignedUrl,
  deleteDocument as deleteFromStorage,
  generateStoragePath,
  MAX_FILE_SIZE,
  compressImage,
  shouldCompress,
} from './services';
import { normalizeDocument, normalizeDocuments } from './adapters/normalizeDocument';
import { supabase } from '@/src/features/auth/service';
import { logger } from '@/src/utils/logger';
import { registerStoreReset } from '@/src/utils/store-reset';

/**
 * Supabase Realtime postgres_changes event payload for wallet_documents
 */
interface DocumentChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
  schema: string;
  table: string;
  commit_timestamp: string;
}

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

  // Actions - CRUD
  createDocument: (input: CreateDocumentInput) => Promise<WalletDocument>;
  updateDocument: (id: string, input: UpdateDocumentInput) => Promise<WalletDocument>;
  deleteDocument: (id: string) => Promise<void>;

  // Actions - Selection
  setSelectedDocument: (document: WalletDocument | null) => void;

  // Actions - Upload
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
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            throw new Error('Not authenticated');
          }

          let query = supabase
            .from('wallet_documents')
            .select('*')
            .eq('wallet_type', 'personal')
            .eq('user_id', userData.user.id);

          // Apply optional filters
          if (filters?.documentType) {
            if (Array.isArray(filters.documentType)) {
              query = query.in('document_type', filters.documentType);
            } else {
              query = query.eq('document_type', filters.documentType);
            }
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          const documents = normalizeDocuments(data || []);
          set({ personalDocuments: documents, personalLoading: false });
          logger.info('WALLET', 'fetchPersonalDocuments completed', { count: documents.length });
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

      fetchGroupDocuments: async (tripId: string, filters?: DocumentFilters) => {
        set({ groupLoading: true, groupError: null });
        logger.info('WALLET', 'fetchGroupDocuments started', { tripId, filters });

        try {
          let query = supabase
            .from('wallet_documents')
            .select('*')
            .eq('wallet_type', 'group')
            .eq('trip_id', tripId);

          // Apply optional filters
          if (filters?.documentType) {
            if (Array.isArray(filters.documentType)) {
              query = query.in('document_type', filters.documentType);
            } else {
              query = query.eq('document_type', filters.documentType);
            }
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          const documents = normalizeDocuments(data || []);
          set((state) => ({
            groupDocuments: { ...state.groupDocuments, [tripId]: documents },
            groupLoading: false,
          }));
          logger.info('WALLET', 'fetchGroupDocuments completed', {
            tripId,
            count: documents.length,
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

      createDocument: async (input: CreateDocumentInput) => {
        logger.info('WALLET', 'createDocument started', {
          name: input.name,
          walletType: input.walletType,
        });

        try {
          // Get current user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            throw new Error('Not authenticated');
          }

          // Validate group wallet has tripId
          if (input.walletType === 'group' && !input.tripId) {
            throw new Error('tripId is required for group wallet documents');
          }

          // Prepare file URI - compress if image
          let fileUri = input.fileUri;
          if (shouldCompress(input.mimeType)) {
            logger.info('WALLET', 'Compressing image');
            fileUri = await compressImage(input.fileUri);
          }

          // Check file size by fetching to get size
          const response = await fetch(fileUri);
          const arrayBuffer = await response.arrayBuffer();
          const fileSize = arrayBuffer.byteLength;

          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(
              `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`
            );
          }

          // Generate storage path
          const storagePath = generateStoragePath(
            input.walletType,
            userData.user.id,
            input.tripId,
            input.name
          );

          // Upload to storage
          await uploadToStorage(fileUri, storagePath, input.mimeType);

          // Insert record into database
          const { data: insertedData, error: insertError } = await supabase
            .from('wallet_documents')
            .insert({
              user_id: userData.user.id,
              wallet_type: input.walletType,
              trip_id: input.tripId || null,
              document_type: input.documentType,
              name: input.name,
              description: input.description || null,
              storage_path: storagePath,
              mime_type: input.mimeType,
              file_size: fileSize,
              metadata: input.metadata || {},
            })
            .select()
            .single();

          if (insertError) {
            // Clean up storage if DB insert fails
            await deleteFromStorage(storagePath).catch(() => {});
            throw new Error(insertError.message);
          }

          const document = normalizeDocument(insertedData);

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

          logger.info('WALLET', 'createDocument completed', { id: document.id });
          return document;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create document';
          logger.error('WALLET', 'createDocument error:', message);
          throw error;
        }
      },

      updateDocument: async (id: string, input: UpdateDocumentInput) => {
        logger.info('WALLET', 'updateDocument started', { id });

        try {
          const { data: updatedData, error } = await supabase
            .from('wallet_documents')
            .update({
              ...(input.name && { name: input.name }),
              ...(input.description !== undefined && { description: input.description }),
              ...(input.documentType && { document_type: input.documentType }),
              ...(input.metadata && { metadata: input.metadata }),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (error) {
            throw new Error(error.message);
          }

          const document = normalizeDocument(updatedData);

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
          // Find document in state to get storage path
          const state = get();
          let document: WalletDocument | undefined;

          document = state.personalDocuments.find((doc) => doc.id === id);
          if (!document) {
            for (const docs of Object.values(state.groupDocuments)) {
              document = docs.find((doc) => doc.id === id);
              if (document) break;
            }
          }

          if (!document) {
            throw new Error('Document not found');
          }

          // Delete from storage
          await deleteFromStorage(document.storagePath);

          // Delete from database
          const { error } = await supabase.from('wallet_documents').delete().eq('id', id);

          if (error) {
            throw new Error(error.message);
          }

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
          // Get current user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            throw new Error('Not authenticated');
          }

          // Validate group wallet has tripId
          if (input.walletType === 'group' && !input.tripId) {
            throw new Error('tripId is required for group wallet documents');
          }

          set({ uploadProgress: 10 });

          // Prepare file URI - compress if image
          let fileUri = input.fileUri;
          let mimeType = input.mimeType;
          if (shouldCompress(input.mimeType)) {
            logger.info('WALLET', 'Compressing image');
            fileUri = await compressImage(input.fileUri);
            mimeType = 'image/jpeg'; // Compressed images are JPEG
          }

          set({ uploadProgress: 30 });

          // Check file size
          const response = await fetch(fileUri);
          const arrayBuffer = await response.arrayBuffer();
          const fileSize = arrayBuffer.byteLength;

          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(
              `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`
            );
          }

          // Generate storage path
          const storagePath = generateStoragePath(
            input.walletType,
            userData.user.id,
            input.tripId,
            input.name
          );

          set({ uploadProgress: 40 });

          // Upload to storage
          await uploadToStorage(fileUri, storagePath, mimeType);

          set({ uploadProgress: 70 });

          // Insert record into database
          const { data: insertedData, error: insertError } = await supabase
            .from('wallet_documents')
            .insert({
              user_id: userData.user.id,
              wallet_type: input.walletType,
              trip_id: input.tripId || null,
              document_type: input.documentType,
              name: input.name,
              description: input.description || null,
              storage_path: storagePath,
              mime_type: mimeType,
              file_size: fileSize,
              metadata: input.metadata || {},
            })
            .select()
            .single();

          if (insertError) {
            // Clean up storage if DB insert fails
            await deleteFromStorage(storagePath).catch(() => {});
            throw new Error(insertError.message);
          }

          set({ uploadProgress: 100 });

          const document = normalizeDocument(insertedData);

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
      // Real-time Event Handling
      // ==========================================

      handleDocumentEvent: (event: unknown) => {
        try {
          const payload = event as DocumentChangeEvent;
          logger.info('WALLET', 'Document event received', {
            eventType: payload.eventType,
            table: payload.table,
          });

          switch (payload.eventType) {
            case 'INSERT': {
              const document = normalizeDocument(payload.new as WalletDocumentResponse);
              const state = get();

              // Skip if document already exists (prevent duplicates from local operations)
              const existsInPersonal = state.personalDocuments.some(
                (doc) => doc.id === document.id
              );
              const existsInGroup = Object.values(state.groupDocuments).some((docs) =>
                docs.some((doc) => doc.id === document.id)
              );

              if (existsInPersonal || existsInGroup) {
                logger.info('WALLET', 'Skipping duplicate INSERT event', {
                  id: document.id,
                });
                return;
              }

              if (document.walletType === 'personal') {
                set((state) => ({
                  personalDocuments: [document, ...state.personalDocuments],
                }));
              } else if (document.walletType === 'group' && document.tripId) {
                set((state) => ({
                  groupDocuments: {
                    ...state.groupDocuments,
                    [document.tripId!]: [
                      document,
                      ...(state.groupDocuments[document.tripId!] || []),
                    ],
                  },
                }));
              }

              logger.info('WALLET', 'Document inserted via realtime', {
                id: document.id,
                walletType: document.walletType,
              });
              break;
            }

            case 'UPDATE': {
              const document = normalizeDocument(payload.new as WalletDocumentResponse);

              const updateInArray = (docs: WalletDocument[]) =>
                docs.map((doc) => (doc.id === document.id ? document : doc));

              set((state) => ({
                personalDocuments: updateInArray(state.personalDocuments),
                groupDocuments: Object.fromEntries(
                  Object.entries(state.groupDocuments).map(([tripId, docs]) => [
                    tripId,
                    updateInArray(docs),
                  ])
                ),
                selectedDocument:
                  state.selectedDocument?.id === document.id ? document : state.selectedDocument,
              }));

              logger.info('WALLET', 'Document updated via realtime', {
                id: document.id,
              });
              break;
            }

            case 'DELETE': {
              const deletedId = (payload.old as { id: string }).id;

              if (!deletedId) {
                logger.error('WALLET', 'DELETE event missing document id', payload.old);
                return;
              }

              const filterOut = (docs: WalletDocument[]) =>
                docs.filter((doc) => doc.id !== deletedId);

              set((state) => ({
                personalDocuments: filterOut(state.personalDocuments),
                groupDocuments: Object.fromEntries(
                  Object.entries(state.groupDocuments).map(([tripId, docs]) => [
                    tripId,
                    filterOut(docs),
                  ])
                ),
                selectedDocument:
                  state.selectedDocument?.id === deletedId ? null : state.selectedDocument,
              }));

              logger.info('WALLET', 'Document deleted via realtime', {
                id: deletedId,
              });
              break;
            }

            default:
              logger.info('WALLET', 'Unknown document event type', {
                eventType: (payload as any).eventType,
              });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to handle document event';
          logger.error('WALLET', 'handleDocumentEvent error:', message);
        }
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

/**
 * Helper to get a signed URL for a document
 */
export async function getDocumentUrl(document: WalletDocument): Promise<string> {
  return getSignedUrl(document.storagePath);
}
