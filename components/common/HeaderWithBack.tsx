import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

interface HeaderWithBackProps {
  title: string;
  onBackPress: () => void;
  rightComponent?: React.ReactNode;
}

export const HeaderWithBack: React.FC<HeaderWithBackProps> = ({
  title,
  onBackPress,
  rightComponent
}) => {
  const { theme } = useAppTheme();

  return (
    <View style={styles(theme).header}>
      <TouchableOpacity 
        style={styles(theme).backButton} 
        onPress={onBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={theme?.colors?.content?.primary || '#1A1A1A'} 
        />
      </TouchableOpacity>
      
      <Text style={styles(theme).headerTitle} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      
      {rightComponent ? (
        <View style={styles(theme).rightContainer}>
          {rightComponent}
        </View>
      ) : (
        <View style={styles(theme).rightPlaceholder} />
      )}
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme?.colors?.border?.default || '#E0E0E0',
    backgroundColor: theme?.colors?.background?.elevated || '#FFFFFF',
    zIndex: 10,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme?.colors?.content?.primary || '#1A1A1A',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: 40,
    height: 40,
  }
}); 