export interface User {
    id: number;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface AuthTokens {
    token: string | null;
    refreshToken: string | null;
  }
  
  export interface JWTPayload {
    sub: string;
    exp: number;
    iat: number;
    email: string;
  }
  
  type AuthStatus = 'idle' | 'signOut' | 'signIn';
  
  export interface AuthState {
    status: AuthStatus;
    isLoading: boolean;
    user: User | null;
    error: string | null;
  }

  export interface TokenManager {
    getToken: () => Promise<string | null>;
    refreshToken: () => Promise<string>;
    clearTokens: () => Promise<void>;
  }
  
  export type AuthAction =
    | { type: 'RESTORE_TOKEN'; user: User }
    | { type: 'SIGN_IN'; user: User }
    | { type: 'SIGN_OUT' }
    | { type: 'START_LOADING' }
    | { type: 'ERROR'; error: string };