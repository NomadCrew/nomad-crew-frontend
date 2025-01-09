export interface User {
    id: number;
    username: string;
    email: string;
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
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;
    isFirstTime: boolean;
    isVerifying: boolean;
    register: (credentials: RegisterCredentials) => Promise<void>;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
    setFirstTimeDone: () => Promise<void>;
    handleGoogleSignInSuccess: (response: GoogleSignInResponse) => Promise<void>;
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
    role: string;
    jti?: string;
  }
  
  export type TokenType = 'access' | 'refresh';
  
  export interface TokenValidationResult {
    isValid: boolean;
    error?: string;
  }

  export interface GoogleSignInResponse {
    data: {
      idToken: string;
      scopes: string[];
      serverAuthCode: string;
      user: {
        email: string;
        familyName: string;
        givenName: string;
        id: string;
        name: string;
        photo?: string;
      };
    };
    type: 'success' | 'cancel';
  }