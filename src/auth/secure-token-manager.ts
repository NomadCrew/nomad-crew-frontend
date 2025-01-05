import createSecureStore from '@neverdull-agency/expo-unlimited-secure-store';
import axios from 'axios';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import type { JWTPayload, TokenValidationResult } from '@/src/types/auth';
import { toByteArray } from 'base64-js';

class SecureTokenManager {
  private static instance: SecureTokenManager;
  private secureStore = createSecureStore();
  private refreshPromise: Promise<string> | null = null;
  private operationLock = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly TOKEN_EXPIRY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  private readonly KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    TOKEN_ID: 'token_id',
  };

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

  private async waitForLock(timeout = 5000): Promise<boolean> {
    const start = Date.now();
    while (this.operationLock) {
      if (Date.now() - start > timeout) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return this.acquireLock();
  }

  private releaseLock(): void {
    this.operationLock = false;
  }

  private async executeWithLock<T>(operation: () => Promise<T>): Promise<T> {
    const locked = await this.waitForLock();
    if (!locked) {
      throw new Error('Failed to acquire lock after timeout');
    }

    try {
      return await operation();
    } finally {
      this.releaseLock();
    }
  }

  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('[TokenManager] Token is not a valid JWT:', token);
        return null;
      }
      const payloadBase64 = parts[1];
      const payloadBytes = toByteArray(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payloadString = new TextDecoder().decode(payloadBytes);
      const payload = JSON.parse(payloadString);
  
      if (!payload.exp || !payload.sub) {
        console.error('[TokenManager] JWT payload missing required fields:', payload);
        return null;
      }
  
      return payload as JWTPayload;
    } catch (error) {
      console.error('[TokenManager] Failed to decode token:', error);
      return null;
    }
  }

  private isTokenExpired(decodedToken: JWTPayload): boolean {
    const now = Date.now();
    const expiryTime = decodedToken.exp * 1000;
    return now >= expiryTime - this.TOKEN_EXPIRY_THRESHOLD;
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    return this.executeWithLock(async () => {
      try {
        console.log('[TokenManager] Saving tokens...');
        const decoded = this.decodeToken(accessToken);
        if (!decoded) throw new Error('Invalid access token format');

        await Promise.all([
          this.secureStore.setItem(this.KEYS.AUTH_TOKEN, accessToken),
          this.secureStore.setItem(this.KEYS.REFRESH_TOKEN, refreshToken),
          decoded.jti
            ? this.secureStore.setItem(this.KEYS.TOKEN_ID, decoded.jti)
            : Promise.resolve(),
        ]);

        this.setupAuthHeader(accessToken);
        console.log('[TokenManager] Tokens saved successfully');
      } catch (error) {
        console.error('[TokenManager] Error saving tokens:', error);
        throw error;
      }
    });
  }

  async getToken(): Promise<string | null> {
    return this.executeWithLock(async () => {
      try {
        const token = await this.secureStore.getItem(this.KEYS.AUTH_TOKEN);
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
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }

  public async getItem(key: string): Promise<string | null> {
    try {

      const storedValue = await this.secureStore.getItem(key);
  
      if (!storedValue) {
        console.warn(`[TokenManager] Key "${key}" not found in storage.`);
        return null;
      }
  
      return storedValue;
    } catch (error) {
      console.error(`[TokenManager] Error getting key "${key}":`, error);
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    try {
      console.log(`[TokenManager] Setting key: ${key}, size: ${value.length} bytes`);
      await this.secureStore.setItem(key, value);
    } catch (error) {
      console.error(`[TokenManager] Error setting key "${key}":`, error);
    }
  }
  
  public async removeItem(key: string): Promise<void> {
    try {
      await this.secureStore.removeItem(key);
    } catch (error) {
      console.error(`[TokenManager] Error removing key "${key}":`, error);
    }
  }

  async clearTokens(): Promise<void> {
    return this.executeWithLock(async () => {
      try {
        await Promise.all([
          this.secureStore.removeItem(this.KEYS.AUTH_TOKEN),
          this.secureStore.removeItem(this.KEYS.REFRESH_TOKEN),
          this.secureStore.removeItem(this.KEYS.TOKEN_ID),
        ]);

        delete api.defaults.headers.common['Authorization'];
        this.retryCount = 0;
      } catch (error) {
        console.error('Error clearing tokens:', error);
        throw error;
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
        const refreshToken = await this.secureStore.getItem(this.KEYS.REFRESH_TOKEN);
        const tokenId = await this.secureStore.getItem(this.KEYS.TOKEN_ID);

        if (!refreshToken || !tokenId) {
          throw new Error('No refresh token available');
        }

        const response = await api.post(API_PATHS.auth.refresh, {
          refreshToken,
          tokenId,
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
}

export const secureTokenManager = SecureTokenManager.getInstance();
