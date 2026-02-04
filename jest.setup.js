/* global jest */

// Set up environment variables for tests FIRST
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest';
process.env.EXPO_PUBLIC_PROJECT_ID = 'test-project-id';

// Mock localStorage FIRST before any imports
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock TanStack Query persisters that use localStorage
jest.mock('@tanstack/query-sync-storage-persister', () => ({
  createSyncStoragePersister: jest.fn(() => ({
    persistClient: jest.fn(),
    removeClient: jest.fn(),
  })),
}));

jest.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: ({ children }) => children,
}));

// Mock the query client module to prevent persister initialization
jest.mock('./src/lib/query-client', () => {
  const { QueryClient } = jest.requireActual('@tanstack/react-query');
  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    queryPersister: { persistClient: jest.fn(), removeClient: jest.fn() },
  };
});

// Mock expo-router
jest.mock('expo-router/entry');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      extra: {
        environment: 'test',
      },
    },
  },
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.NativeAnimatedModule = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    getValue: jest.fn(),
  };
  return RN;
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock Supabase - mock the @supabase/supabase-js module directly
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Also provide the supabase export for direct imports
global.mockSupabaseClient = mockSupabaseClient;

// Setup test environment
global.fetch = jest.fn(); 