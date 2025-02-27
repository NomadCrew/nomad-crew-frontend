import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';
import { ThemedView } from '@/components/ThemedView';
import { useTripStore } from '@/src/store/useTripStore';
import { jwtDecode } from 'jwt-decode';

interface InvitationToken {
  tripId?: string;
  inviteeEmail?: string;
  invitationId?: string;
  exp?: number;
}

export default function InvitationScreen() {
  const { token } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleInvitation = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('No invitation token provided');
        return;
      }

      if (typeof token !== 'string') {
        setStatus('error');
        setErrorMessage('Invalid token format');
        return;
      }

      try {
        // Decode token to check its validity
        let decodedToken: InvitationToken;
        try {
          decodedToken = jwtDecode(token);
          
          // Check if token is expired
          if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
            setStatus('error');
            setErrorMessage('Invitation has expired');
            return;
          }
          
          // Check if token has required fields
          if (!decodedToken.tripId) {
            // Token missing tripId
          }
          
          if (!decodedToken.invitationId) {
            // Token missing invitationId
          }
        } catch (decodeError) {
          // Failed to decode token
        }

        // For logged-in users: accept invitation directly
        if (user) {
          await useTripStore.getState().acceptInvitation(token);
          setStatus('success');
          setTimeout(() => {
            router.replace('/(tabs)/trips');
          }, 1500);
        } else {
          // Store invitation token for after login
          await AsyncStorage.setItem('pendingInvitation', token);
          setStatus('success');
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 1500);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to process invitation');
      }
    };

    handleInvitation();
  }, [token, user]);

  return (
    <ThemedView style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.text}>Processing invitation...</Text>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Text style={styles.title}>Invitation Accepted!</Text>
          <Text style={styles.text}>
            {user 
              ? 'You have been added to the trip. Redirecting to your trips...' 
              : 'Please log in to join the trip. Redirecting to login...'}
          </Text>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Text style={styles.title}>Invitation Error</Text>
          <Text style={styles.errorText}>{errorMessage || 'Failed to process invitation'}</Text>
          <Text style={styles.text}>Please try again or contact support.</Text>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
}); 