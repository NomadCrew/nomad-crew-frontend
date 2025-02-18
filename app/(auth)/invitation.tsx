import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedView } from '@/components/ThemedView';
import { useTripStore } from '@/src/store/useTripStore';

export default function InvitationScreen() {
  const { token } = useLocalSearchParams();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleInvitation = async () => {
      if (!token) return;

      if (typeof token !== 'string') {
        console.error('Invalid token format');
        router.replace('/(tabs)');
        return;
      }

      try {
        // For logged-in users: accept invitation directly
        if (user) {
          await useTripStore.getState().acceptInvitation(token as string);
          router.replace('/(tabs)/trips');
        } else {
          // Store invitation token for after login
          await AsyncStorage.setItem('pendingInvitation', token as string);
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Invitation handling failed:', error);
        router.replace('/(tabs)');
      }
    };

    handleInvitation();
  }, [token]);

  return <ThemedView style={{ flex: 1 }} />;
} 