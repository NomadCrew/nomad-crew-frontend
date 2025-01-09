import { BaseApiClient } from './base-client';
import { supabase } from '@/src/auth/supabaseClient';

export class ApiClient extends BaseApiClient {
  private static instance: ApiClient;

  private constructor() {
    super();
    this.setupAuthInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupAuthInterceptors(): void {
    // 1) Attach the current token from Supabase before each request
    this.api.interceptors.request.use(
      async (config) => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
        }
        config.headers.apikey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2) If a 401 slips through, you can sign out or handle it gracefully
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Optionally: supabase.auth.signOut(), redirect user, etc.
        }
        return Promise.reject(error);
      }
    );
  }
}

// Singleton
export const apiClient = ApiClient.getInstance();
export const api = apiClient.getAxiosInstance();
