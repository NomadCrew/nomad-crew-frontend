import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/features/auth/store';

interface OnboardingContextProps {
  isFirstTime: boolean;
  isInitialized: boolean;
  setFirstTimeDone: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

// Default context value with valid types
const defaultContextValue: OnboardingContextProps = {
  isFirstTime: true,
  isInitialized: false,
  setFirstTimeDone: async () => { /* default implementation */ },
  forceRefresh: async () => { /* default implementation */ }
};

const OnboardingContext = createContext<OnboardingContextProps>(defaultContextValue);

// Storage key for onboarding state - must match auth store key
const ONBOARDING_STORAGE_KEY = '@app_first_time_done';

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { status } = useAuthStore();

  // Check first launch status from storage
  const checkFirstLaunch = useCallback(async () => {
    try {
      // Read from AsyncStorage with error handling
      const firstLaunch = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      // Auth store sets 'true' when first time is done, so check for 'true'
      const isFirst = firstLaunch !== 'true';
      
      // Log for debugging
      logger.debug('ONBOARDING', `First launch check result: ${firstLaunch}`);
      console.log('[OnboardingProvider] firstLaunch:', firstLaunch, 'isFirstTime:', isFirst);
      
      // Update state
      setIsFirstTime(isFirst);
      return isFirst;
    } catch (error) {
      // Log error and fall back to default (first time)
      logger.error('ONBOARDING', 'Failed to check first launch:', error);
      setIsFirstTime(true);
      return true;
    }
  }, []);

  // Initialize onboarding state when app starts
  useEffect(() => {
    const initializeOnboarding = async () => {
      await checkFirstLaunch();
      setIsInitialized(true);
    };
    
    initializeOnboarding();
  }, [checkFirstLaunch]);

  // Re-check onboarding status when auth state changes to 'authenticated'
  // This handles cases where user authenticates and first-time flag gets set
  useEffect(() => {
    if (status === 'authenticated' && isInitialized) {
      // Small delay to ensure AsyncStorage write from auth store completes
      const timeoutId = setTimeout(() => {
        checkFirstLaunch();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [status, isInitialized, checkFirstLaunch]);

  // Function to mark onboarding as complete
  const setFirstTimeDone = async () => {
    try {
      // Update local state first for responsiveness
      setIsFirstTime(false);
      
      // Then persist to AsyncStorage - use 'true' to match auth store
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      console.log('[OnboardingProvider] setFirstTimeDone called, isFirstTime set to false');
      
      return Promise.resolve();
    } catch (error) {
      logger.error('ONBOARDING', 'Failed to save first launch state:', error);
      return Promise.reject(error);
    }
  };

  // Log current state for debugging
  console.log('[OnboardingProvider] Providing context:', { isFirstTime, isInitialized });

  // Force refresh function to re-check storage
  const forceRefresh = async () => {
    await checkFirstLaunch();
  };

  // Always provide context values, never return null
  return (
    <OnboardingContext.Provider 
      value={{ isFirstTime, isInitialized, setFirstTimeDone, forceRefresh }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// Hook for accessing onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};
