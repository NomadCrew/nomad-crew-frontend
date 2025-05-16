import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Ionicons } from '@expo/vector-icons';

interface ChatAuthErrorProps {
  onRetry: () => void;
}

export const ChatAuthError: React.FC<ChatAuthErrorProps> = ({ onRetry }) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles(theme).container}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
      <Text style={styles(theme).title}>Authentication Required</Text>
      <Text style={styles(theme).message}>
        Unable to load chat messages. Please check your connection or login status.
      </Text>
      <TouchableOpacity style={styles(theme).button} onPress={onRetry}>
        <Text style={styles(theme).buttonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.primary
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24
  },
  button: {
    backgroundColor: theme.colors.primary.default,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  buttonText: {
    color: theme.colors.text.onPrimary,
    fontWeight: '600'
  }
}); 