import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';

interface AuthOptionButtonProps {
  provider: 'google' | 'email';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function AuthOptionButton({
  provider,
  label,
  onPress,
  disabled = false
}: AuthOptionButtonProps) {
  const { theme } = useTheme();
  
  // Define icon based on provider
  const getIcon = () => {
    switch(provider) {
      case 'google':
        return <ThemedView>
          {/* Use Google's 'G' logo for brand guidelines */}
          <ThemedText style={styles.googleIcon}>G</ThemedText>
        </ThemedView>;
      case 'email':
        return <Mail size={20} color={theme.colors.content.primary} />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface.default,
          borderColor: theme.colors.border.default,
          opacity: pressed ? 0.9 : 1
        }
      ]}
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          {getIcon()}
        </ThemedView>
        <ThemedText style={[
          styles.label,
          { color: theme.colors.content.primary }
        ]}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4285F4',
  },
});