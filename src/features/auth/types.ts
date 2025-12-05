import { Session as SupabaseSession } from '@supabase/supabase-js'; // Alias to avoid conflict if we define our own Session

// Copied from src/types/auth.ts
export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    createdAt?: string;
    updatedAt?: string;
    appleUser?: boolean;
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

// Three-state authentication pattern (recommended by Obytes Starter & community best practices)
// - 'idle': Initial state - we don't know yet if user is authenticated (checking storage)
// - 'authenticated': User has valid token
// - 'unauthenticated': User has no token or token is invalid
// - 'verifying': User is in email verification flow
export type AuthStatus = 'idle' | 'unauthenticated' | 'authenticated' | 'verifying';

// Custom Session interface removed as it's redundant with SupabaseSession
// and SupabaseSession is already used where a Session object is handled (e.g. AuthState.handleAppleSignInSuccess)

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

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    status: AuthStatus;
    isInitialized: boolean;
    isFirstTime: boolean;
    isVerifying: boolean;
    pushToken: string | null;
    register: (credentials: RegisterCredentials) => Promise<void>;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
    setFirstTimeDone: () => Promise<void>;
    handleGoogleSignInSuccess: (session: SupabaseSession) => Promise<void>;
    handleAppleSignInSuccess: (session: SupabaseSession) => Promise<void>;
    refreshToken: string | null;
    refreshSession: () => Promise<void>;
    registerPushToken: () => Promise<void>;
    needsUsername: boolean;
    setNeedsUsername: (value: boolean) => void;
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

// Moved from store.ts
export interface ApiError extends Error {
    response?: {
        data?: {
            code?: string;
            message?: string;
            login_required?: boolean;
            [key: string]: unknown;
        };
        status?: number;
    };
    status?: number;
    code?: string;
    [key: string]: unknown;
}

// Copied from bottom of src/types/auth.ts
// This global augmentation might be better placed in a global.d.ts if not auth-specific
// For now, keeping it with other types from the same file.
declare global {
    interface URLSearchParams {
        get(name: string): string | null;
    }
} 