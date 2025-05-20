import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/utils/logger';
import { View, ActivityIndicator } from 'react-native';

interface OnboardingContextProps {
  isFirstTime: boolean;
  isInitialized: boolean;
  setFirstTimeDone: () => Promise<void>;
}

// Default context value with valid types
const defaultContextValue: OnboardingContextProps = {
  isFirstTime: true,
  isInitialized: false,
  setFirstTimeDone: async () => { /* default implementation */ }
};

const OnboardingContext = createContext<OnboardingContextProps>(defaultContextValue);

// Storage key for onboarding state
const ONBOARDING_STORAGE_KEY = 'isFirstLaunch';

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize onboarding state when app starts
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Read from AsyncStorage with error handling
        const firstLaunch = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        
        // Use strict equality check against 'false' string
        const isFirst = firstLaunch !== 'false';
        
        // Log for debugging
        logger.debug('ONBOARDING', `First launch check result: ${firstLaunch}`);
        console.log('[OnboardingProvider] firstLaunch:', firstLaunch, 'isFirstTime:', isFirst);
        
        // Update state
        setIsFirstTime(isFirst);
        setIsInitialized(true);
      } catch (error) {
        // Log error and fall back to default (first time)
        logger.error('ONBOARDING', 'Failed to check first launch:', error);
        setIsFirstTime(true);
        setIsInitialized(true);
      }
    };
    
    // Start initialization
    checkFirstLaunch();
  }, []);

  // Function to mark onboarding as complete
  const setFirstTimeDone = async () => {
    try {
      // Update local state first for responsiveness
      setIsFirstTime(false);
      
      // Then persist to AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
      console.log('[OnboardingProvider] setFirstTimeDone called, isFirstTime set to false');
      
      return Promise.resolve();
    } catch (error) {
      logger.error('ONBOARDING', 'Failed to save first launch state:', error);
      return Promise.reject(error);
    }
  };

  // Log current state for debugging
  console.log('[OnboardingProvider] Providing context:', { isFirstTime, isInitialized });

  // Always provide context values, never return null
  return (
    <OnboardingContext.Provider 
      value={{ isFirstTime, isInitialized, setFirstTimeDone }}
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
