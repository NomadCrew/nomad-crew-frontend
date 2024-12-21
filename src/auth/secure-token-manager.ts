import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import type { JWTPayload, TokenValidationResult } from '@/src/types/auth';
import { TokenManager } from './types';

interface StorageKeys {
  readonly AUTH_TOKEN: string;
  readonly REFRESH_TOKEN: string;
  readonly TOKEN_ID: string;
}

class SecureTokenManager implements TokenManager {
  private static instance: SecureTokenManager;
  private refreshPromise: Promise<string> | null = null;
  private operationLock = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly TOKEN_EXPIRY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  
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

        const validationResult = await this.validateToken(token);
        if (!validationResult.isValid) {
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

  private async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return { isValid: false, error: 'Invalid token format' };
      }

      if (this.isTokenExpired(decoded)) {
        return { isValid: false, error: 'Token expired' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Token validation failed' };
    }
  }

  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const decoded = jwtDecode<JWTPayload>(token);
      if (!decoded.exp || !decoded.jti || !decoded.sub) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    return this.executeWithLock(async () => {
        try {
            const decoded = this.decodeToken(accessToken);
            if (!decoded) {
                throw new Error('Invalid access token format');
            }
            console.log('Token:', accessToken, 'Type:', typeof accessToken);
            console.log('Refresh Token:', refreshToken, 'Type:', typeof refreshToken);
            await Promise.all([
                this.storage.setItem(this.KEYS.AUTH_TOKEN, accessToken),
                this.storage.setItem(this.KEYS.REFRESH_TOKEN, refreshToken),
                this.storage.setItem(this.KEYS.TOKEN_ID, String(decoded.jti))
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

  private isTokenExpired(decodedToken: JWTPayload): boolean {
    const now = Date.now();
    const expiryTime = decodedToken.exp * 1000;
    return now >= expiryTime - this.TOKEN_EXPIRY_THRESHOLD;
  }

  async refreshToken(): Promise<string> {
    if (this.retryCount >= this.MAX_RETRIES) {
      await this.clearTokens();
      throw new Error('Max refresh attempts exceeded');
    }

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

        const response = await api.post(API_PATHS.auth.refresh, { 
          refreshToken,
          tokenId
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        await this.saveTokens(newAccessToken, newRefreshToken);
        this.retryCount++;
        
        return newAccessToken;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
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
  async validateTokenWithServer(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const tokenId = await this.storage.getItem(this.KEYS.TOKEN_ID);
      if (!tokenId) return false;

      await api.post(API_PATHS.auth.validate, { tokenId });
      return true;
    } catch {
      await this.clearTokens();
      return false;
    }
  }
}

export const secureTokenManager = SecureTokenManager.getInstance();