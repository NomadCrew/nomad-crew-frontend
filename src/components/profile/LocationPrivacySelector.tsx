import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useThemedStyles } from '@/src/theme/utils';

export type LocationPrivacyLevel = 'hidden' | 'approximate' | 'precise';

export interface LocationPrivacySelectorProps {
  value: LocationPrivacyLevel;
  onChange: (value: LocationPrivacyLevel) => void;
  disabled?: boolean;
}

interface PrivacyOption {
  key: LocationPrivacyLevel;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}

const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    key: 'hidden',
    icon: 'eye-off-outline',
    label: 'Hidden',
    description: 'Location not shared',
  },
  {
    key: 'approximate',
    icon: 'location-outline',
    label: 'Approximate',
    description: 'City-level only',
  },
  {
    key: 'precise',
    icon: 'navigate-outline',
    label: 'Precise',
    description: 'Exact location',
  },
];

/**
 * A prominent location privacy selector component with three options.
 * Displays as a horizontal button group with icons and descriptions.
 */
export function LocationPrivacySelector({
  value,
  onChange,
  disabled = false,
}: LocationPrivacySelectorProps) {
  const styles = useThemedStyles((theme) => ({
    container: {
      flexDirection: 'row' as const,
      gap: theme.spacing?.inline?.sm ?? 8,
      paddingHorizontal: theme.spacing?.inset?.md ?? 16,
    },
    option: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: theme.spacing?.inset?.md ?? 16,
      paddingHorizontal: theme.spacing?.inset?.sm ?? 8,
      borderRadius: theme.borderRadius?.md ?? 8,
      borderWidth: 2,
    },
    optionUnselected: {
      backgroundColor: theme.colors?.background?.card ?? '#FFFFFF',
      borderColor: theme.colors?.border?.default ?? '#E5E7EB',
    },
    optionSelected: {
      backgroundColor: theme.colors?.primary?.main ?? '#F46315',
      borderColor: theme.colors?.primary?.main ?? '#F46315',
    },
    optionDisabled: {
      opacity: 0.5,
    },
    iconContainer: {
      marginBottom: theme.spacing?.stack?.xs ?? 4,
    },
    labelContainer: {
      marginBottom: theme.spacing?.stack?.xxs ?? 2,
    },
    primaryColor: theme.colors?.primary?.main ?? '#F46315',
    contentPrimary: theme.colors?.content?.primary ?? '#1A1A1A',
    contentSecondary: theme.colors?.content?.secondary ?? '#6B7280',
    contentTertiary: theme.colors?.content?.tertiary ?? '#9CA3AF',
    white: '#FFFFFF',
  }));

  const handlePress = (key: LocationPrivacyLevel) => {
    if (!disabled && key !== value) {
      onChange(key);
    }
  };

  return (
    <View style={styles.container}>
      {PRIVACY_OPTIONS.map((option) => {
        const isSelected = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => handlePress(option.key)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              isSelected ? styles.optionSelected : styles.optionUnselected,
              disabled && styles.optionDisabled,
              { transform: [{ scale: pressed && !disabled ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={option.icon}
                size={24}
                color={isSelected ? styles.white : styles.primaryColor}
              />
            </View>
            <View style={styles.labelContainer}>
              <ThemedText
                variant="body.medium"
                style={{
                  color: isSelected ? styles.white : styles.contentPrimary,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                {option.label}
              </ThemedText>
            </View>
            <ThemedText
              variant="body.small"
              style={{
                color: isSelected ? styles.white : styles.contentSecondary,
                textAlign: 'center',
              }}
            >
              {option.description}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default React.memo(LocationPrivacySelector);
