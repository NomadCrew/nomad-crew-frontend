import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { ThemedText } from '@/src/components/ThemedText';
import type { Theme } from '@/src/theme/types';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  size?: number;
  label?: string;
}

export const IconButton = ({ 
  icon: Icon, 
  onPress, 
  size = 24,
  label 
}: IconButtonProps) => {
  const { theme } = useAppTheme();
  
  return (
    <View style={styles(theme).container}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles(theme).button,
          pressed && styles(theme).pressed
        ]}
      >
        <Icon 
          size={size} 
          color={theme.colors.content.primary}
          strokeWidth={1.5}
        />
      </Pressable>
      {label && (
        <ThemedText style={styles(theme).label}>
          {label}
        </ThemedText>
      )}
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.stack.xs,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface.variant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: theme.colors.primary.hover,
    transform: [{ scale: 0.95 }],
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.content.secondary,
  },
});