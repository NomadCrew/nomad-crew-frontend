import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Mail, Facebook, Apple } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/src/theme/ThemeProvider';
import  GoogleIcon  from '../icons/google';

interface AuthOptionButtonProps {
  provider: 'google' | 'facebook' | 'apple' | 'email';
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
  
  const getIcon = () => {
    switch(provider) {
      case 'google':
        return <GoogleIcon color={theme.colors.content.primary} />;
      case 'facebook':
        return <Facebook size={20} color={theme.colors.content.primary} />;
      case 'apple':
        return <Apple size={20} color={theme.colors.content.primary} />;
      case 'email':
        return <Mail size={25} color={theme.colors.content.primary} />;
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
        <ThemedText
          style={[
            styles.label,
            {
              flex: 1, // Center the text by taking up remaining space
              textAlign: 'center', // Center-align the label within the flex container
            },
          ]}
        >
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    width: '100%',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});