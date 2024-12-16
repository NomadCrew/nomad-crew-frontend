import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { api } from '@/src/api/instance';

interface DecodedToken {
  exp: number;
  sub: string;
  jti: string; // Token ID for validation
}

interface StorageKeys {
  readonly AUTH_TOKEN: string;
  readonly REFRESH_TOKEN: string;
  readonly TOKEN_ID: string;
}

class SecureTokenManager {
  private static instance: SecureTokenManager;
  private refreshPromise: Promise<string> | null = null;
  private operationLock = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  
  private readonly KEYS: StorageKeys = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    TOKEN_ID: 'token_id'
  };

  // Use SecureStore on native platforms, AsyncStorage on web
  private readonly storage = Platform.select({
    native: {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync
    },
    default: {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
      removeItem: AsyncStorage.removeItem
    }
  });

  private constructor() {}

  static getInstance(): SecureTokenManager {
    if (!this.instance) {
      this.instance = new SecureTokenManager();
    }
    return this.instance;
  }

  private async acquireLock(): Promise<boolean> {
    if (this.operationLock) {
      return false;
    }
    this.operationLock = true;
    return true;
  }

  private releaseLock(): void {
    this.operationLock = false;
  }

  private async executeWithLock<T>(operation: () => Promise<T>): Promise<T> {
    if (!await this.acquireLock()) {
      throw new Error('Operation in progress');
    }
    try {
      return await operation();
    } finally {
      this.releaseLock();
    }
  }

  async getToken(): Promise<string | null> {
    return this.executeWithLock(async () => {
      try {
        const token = await this.storage.getItem(this.KEYS.AUTH_TOKEN);
        if (!token) return null;

        // Validate token format and signature
        if (!this.isValidTokenFormat(token)) {
          await this.clearTokens();
          return null;
        }

        return token;
      } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
      }
    });
  }

  private isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const decoded = jwtDecode<DecodedToken>(token);
      return !!(decoded.exp && decoded.jti && decoded.sub);
    } catch {
      return false;
    }
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    return this.executeWithLock(async () => {
      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        
        await Promise.all([
          this.storage.setItem(this.KEYS.AUTH_TOKEN, accessToken),
          this.storage.setItem(this.KEYS.REFRESH_TOKEN, refreshToken),
          this.storage.setItem(this.KEYS.TOKEN_ID, decoded.jti)
        ]);

        this.setupAuthHeader(accessToken);
      } catch (error) {
        console.error('Error saving tokens:', error);
        throw new Error('Failed to save authentication tokens');
      }
    });
  }

  async clearTokens(): Promise<void> {
    return this.executeWithLock(async () => {
      try {
        await Promise.all([
          this.storage.removeItem(this.KEYS.AUTH_TOKEN),
          this.storage.removeItem(this.KEYS.REFRESH_TOKEN),
          this.storage.removeItem(this.KEYS.TOKEN_ID)
        ]);
        
        delete api.defaults.headers.common['Authorization'];
        this.retryCount = 0;
      } catch (error) {
        console.error('Error clearing tokens:', error);
        throw new Error('Failed to clear authentication tokens');
      }
    });
  }

  setupAuthHeader(token: string): void {
    if (!token) {
      delete api.defaults.headers.common['Authorization'];
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // Check if token expires in less than 5 minutes
      return Date.now() >= (decoded.exp * 1000) - (5 * 60 * 1000);
    } catch {
      return true;
    }
  }

  async refreshToken(): Promise<string> {
    if (this.retryCount >= this.MAX_RETRIES) {
      await this.clearTokens();
      throw new Error('Max refresh attempts exceeded');
    }

    // Ensure only one refresh request at a time
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.executeWithLock(async () => {
      try {
        const refreshToken = await this.storage.getItem(this.KEYS.REFRESH_TOKEN);
        const tokenId = await this.storage.getItem(this.KEYS.TOKEN_ID);
        
        if (!refreshToken || !tokenId) {
          throw new Error('No refresh token available');
        }

        const response = await api.post('/auth/refresh', { 
          refreshToken,
          tokenId // Send token ID for server-side validation
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        await this.saveTokens(newAccessToken, newRefreshToken);
        this.retryCount++;
        
        return newAccessToken;
      } catch (error) {
        if (error.response?.status === 401) {
          await this.clearTokens();
          throw new Error('Refresh token expired');
        }
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  // Validate token with server
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      await api.post('/auth/validate', {
        tokenId: await this.storage.getItem(this.KEYS.TOKEN_ID)
      });
      
      return true;
    } catch {
      return false;
    }
  }
}

export const secureTokenManager = SecureTokenManager.getInstance();