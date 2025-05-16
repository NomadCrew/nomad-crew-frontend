/**
 * Utility functions for handling JWT tokens
 */

import { logger } from './logger';

/**
 * Interface for the JWT token payload
 */
export interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  user_id?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Parse a JWT token to extract its payload
 * @param token The JWT token to parse
 * @returns The decoded payload or null if parsing fails
 */
export function parseJwt(token: string | null): JwtPayload | null {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('AUTH', 'Failed to parse JWT token:', error);
    return null;
  }
}

/**
 * Check if a token is expiring soon (within the next 5 minutes)
 * @param token The JWT token to check
 * @returns True if the token is expiring soon, false otherwise
 */
export function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true;
  
  const tokenData = parseJwt(token);
  if (!tokenData || !tokenData.exp) return true;
  
  // Check if token expires in less than 5 minutes (300 seconds)
  const expiresIn = tokenData.exp * 1000 - Date.now();
  return expiresIn < 5 * 60 * 1000;
}

/**
 * Get the expiration time of a token in milliseconds
 * @param token The JWT token
 * @returns The expiration time in milliseconds, or null if the token is invalid
 */
export function getTokenExpirationTime(token: string | null): number | null {
  if (!token) return null;
  
  const tokenData = parseJwt(token);
  if (!tokenData || !tokenData.exp) return null;
  
  return tokenData.exp * 1000;
} 