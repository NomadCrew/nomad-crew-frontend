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
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;
    isFirstTime: boolean;
    isVerifying: boolean;
    initialize: () => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    setFirstTimeDone: () => Promise<void>;
    handleGoogleSignInSuccess: (response: any) => Promise<void>;
  }
  
  export interface RegisterCredentials {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
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