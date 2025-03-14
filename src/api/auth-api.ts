import { BaseApiClient } from './base-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { logger } from '@/src/utils/logger';

/**
 * AuthApi - Handles authentication-related API calls
 * This is separated from the main API client to avoid circular dependencies
 */
class AuthApi extends BaseApiClient {
  private static instance: AuthApi;

  private constructor() {
    super();
  }

  public static getInstance(): AuthApi {
    if (!AuthApi.instance) {
      AuthApi.instance = new AuthApi();
    }
    return AuthApi.instance;
  }

  /**
   * Refresh the authentication token
   * @param refreshToken The refresh token to use
   * @returns The new access token and refresh token
   */
  public async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      logger.debug('AUTH API', 'Refreshing token');
      const response = await this.api.post(API_PATHS.auth.refresh, {
        refresh_token: refreshToken
      });
      return response.data;
    } catch (error) {
      logger.error('AUTH API', 'Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  public async login(email: string, password: string) {
    try {
      const response = await this.api.post(API_PATHS.auth.login, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      logger.error('AUTH API', 'Login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  public async register(userData: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }) {
    try {
      const response = await this.api.post(API_PATHS.auth.register, userData);
      return response.data;
    } catch (error) {
      logger.error('AUTH API', 'Registration failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const authApi = AuthApi.getInstance(); 