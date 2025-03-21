import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface AutocompleteRowProps {
  data: any;
}

export function AutocompleteRow({ data }: AutocompleteRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface }
      ]}
    >
      <Text style={styles.mainText}>
        {data.structured_formatting.main_text}
      </Text>
      {data.structured_formatting.secondary_text && (
        <Text style={[styles.secondaryText, { color: theme.colors.outline }]}>
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