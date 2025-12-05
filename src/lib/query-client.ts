import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a custom storage adapter for React Native
// AsyncStorage is async but the persister expects sync methods
// We wrap AsyncStorage to make it compatible
const asyncStorageAdapter = {
  getItem: (key: string) => {
    // Return the promise - the persister will handle it
    return AsyncStorage.getItem(key).then((value) => value ?? null);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

export const queryPersister = createSyncStoragePersister({
  storage: asyncStorageAdapter as any, // Type assertion needed for async methods
  key: 'NOMADCREW_QUERY_CACHE',
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Mobile app, not a browser
    },
    mutations: {
      retry: 1,
    },
  },
});
