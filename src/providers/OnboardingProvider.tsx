import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextProps {
  isFirstTime: boolean;
  setFirstTimeDone: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextProps | null>(null);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const firstLaunch = await AsyncStorage.getItem('isFirstLaunch');
        setIsFirstTime(!firstLaunch);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to check first launch:', error);
        setIsInitialized(true);
      }
    };
    checkFirstLaunch();
  }, []);

  if (!isInitialized) return null;

  const setFirstTimeDone = async () => {
    try {
      setIsFirstTime(false);
      await AsyncStorage.setItem('isFirstLaunch', 'false');
    } catch (error) {
      console.error('Failed to save first launch state:', error);
      // Consider whether to revert state or notify user
    }
  };

  return (
    <OnboardingContext.Provider value={{ isFirstTime, setFirstTimeDone }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};
