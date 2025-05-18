import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { useAuthStore } from '@/src/features/auth/store';
import { Button } from 'react-native-paper';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Profile</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        {user && (
          <>
            <ThemedText variant="body.large" style={styles.email}>
              {user.email}
            </ThemedText>
            
            <Button 
              mode="contained" 
              onPress={handleSignOut}
              style={styles.button}
            >
              Sign Out
            </Button>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  email: {
    marginBottom: 32,
  },
  button: {
    width: '80%',
  },
}); 