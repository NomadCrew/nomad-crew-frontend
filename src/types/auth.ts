export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export type AuthStatus = 'unauthenticated' | 'authenticated' | 'verifying';
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    status: AuthStatus;
    isInitialized: boolean;
    isFirstTime: boolean;
    isVerifying: boolean;
    register: (credentials: RegisterCredentials) => Promise<void>;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
    setFirstTimeDone: () => Promise<void>;
    handleGoogleSignInSuccess: (response: GoogleSignInResponse) => Promise<void>;
    handleAppleSignInSuccess: (session: Session) => Promise<void>;
    refreshToken: string | null;
    refreshSession: () => Promise<void>;
  }
  
  export interface AuthTokens {
    token: string;
    refreshToken: string;
  }
  
  export interface JWTPayload {
    sub: string;
    exp: number;
    iat: number;
    email: string;
    role?: string;
    jti?: string;
  }
  
  export type TokenType = 'access' | 'refresh';
  
  export interface TokenValidationResult {
    isValid: boolean;
    error?: string;
  }

  export interface GoogleSignInResponse {
    authentication: {
      accessToken: string;
      idToken: string;
    };
    user: {
      email?: string;
      name?: string;
      photo?: string;
    };
  }

declare global {
  interface URLSearchParams {
    get(name: string): string | null;
  }
}