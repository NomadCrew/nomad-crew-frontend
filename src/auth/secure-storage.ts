import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Use SecureStore on native platforms, fallback to AsyncStorage on web
const storage = Platform.select({
  web: {
    async getItem(key: string) {
      return AsyncStorage.getItem(key);
    },
    async setItem(key: string, value: string) {
      return AsyncStorage.setItem(key, value);
    },
    async removeItem(key: string) {
      return AsyncStorage.removeItem(key);
    },
  },
  default: {
    async getItem(key: string) {
      return SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string) {
      return SecureStore.setItemAsync(key, value);
    },
    async removeItem(key: string) {
      return SecureStore.deleteItemAsync(key);
    },
  },
});

export const secureStorage = {
  async getTokens() {
    const [token, refreshToken] = await Promise.all([
      storage.getItem(TOKEN_KEY),
      storage.getItem(REFRESH_TOKEN_KEY),
    ]);
    return { token, refreshToken };
  },

  async setTokens(token: string, refreshToken: string) {
    await Promise.all([
      storage.setItem(TOKEN_KEY, token),
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens() {
    await Promise.all([
      storage.removeItem(TOKEN_KEY),
      storage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
