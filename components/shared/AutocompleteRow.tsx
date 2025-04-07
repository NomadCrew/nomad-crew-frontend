import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

interface AutocompleteRowProps {
  data: GooglePlacePrediction;
}

export function AutocompleteRow({ data }: AutocompleteRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surface.variant : theme.colors.surface.default }
      ]}
    >
      <Text style={styles.mainText}>
        {data.structured_formatting.main_text}
      </Text>
      {data.structured_formatting.secondary_text && (
        <Text style={[styles.secondaryText, { color: theme.colors.content.secondary }]}>
          {data.structured_formatting.secondary_text}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  mainText: {
    fontSize: 14,
  },
  secondaryText: {
    fontSize: 12,
  }
}); 