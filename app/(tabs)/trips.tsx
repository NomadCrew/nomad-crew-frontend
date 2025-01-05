import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedView } from '@/components/ThemedView';

export default function TripsScreen() {
  const [activeTab, setActiveTab] = useState('Active');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const searchWidth = useRef(new Animated.Value(40)).current;

  const toggleSearch = () => {
    Animated.timing(searchWidth, {
      toValue: searchExpanded ? 40 : screenWidth * 0.7, 
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSearchExpanded(!searchExpanded));
  };

  return (
    <SafeAreaView style={styles(theme, screenWidth).container}>
      <ThemedView style={styles(theme).header}>
        {/* Header Title */}
        <Text style={styles(theme).title} numberOfLines={1}>
          Trips
        </Text>

        {/* Animated Search Bar */}
        <Animated.View
          style={[
            styles(theme).searchBar,
            { width: searchWidth },
          ]}
        >
          <TouchableOpacity
            onPress={toggleSearch}
            style={styles(theme).searchIcon}
          >
            <Ionicons
              name={searchExpanded ? 'close-outline' : 'search-outline'}
              size={20}
              color={theme.colors.content.primary}
            />
          </TouchableOpacity>
          {searchExpanded && (
            <TextInput
              style={styles(theme).searchInput}
              placeholder="Search trips"
              placeholderTextColor={theme.colors.content.secondary}
              onBlur={toggleSearch}
            />
          )}
        </Animated.View>
      </ThemedView>

      {/* Tabs Section */}
      <ThemedView style={styles(theme).tabs}>
        {['Active', 'Recent', 'Cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles(theme).tabButton,
              activeTab === tab && styles(theme).activeTabButton,
            ]}
          >
            <Text
              style={[
                styles(theme).tabText,
                activeTab === tab && styles(theme).activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* FAB */}
      <TouchableOpacity style={styles(theme).fab}>
        <Ionicons
          name="add-outline"
          size={24}
          color={theme.colors.primary.onPrimary}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = (theme, screenWidth) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.variant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end', 
      justifyContent: 'space-between', 
      paddingHorizontal: theme.spacing.layout.screen.padding,
      marginBottom: theme.spacing.layout.section.gap,
      backgroundColor: theme.colors.surface.variant,
    },
    title: {
      ...theme.typography.heading.h1,
      color: '#FFFFFF',
      marginBottom: theme.spacing.inset.sm,
      marginTop: theme.spacing.stack.md,
      flexShrink: 0,
      flexGrow: 0,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.spacing.inset.sm * 2,
      height: 36,
      overflow: 'hidden',
      backgroundColor: '#2C2C2C',
      marginBottom: theme.spacing.inset.sm,
    },
    searchIcon: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.inset.sm,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: theme.spacing.inset.sm,
      paddingVertical: 4,
      height: 36,
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginBottom: theme.spacing.layout.section.padding,
      backgroundColor: theme.colors.surface.variant,
    },
    tabButton: { paddingVertical: theme.spacing.inline.sm },
    activeTabButton: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary.main,
    },
    tabText: {
      ...theme.typography.button.medium,
      color: theme.colors.content.secondary,
    },
    activeTabText: {
      color: theme.colors.primary.main,
      fontWeight: theme.typography.button.medium.fontWeight,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.layout.section.padding + 80,
      right: theme.spacing.layout.section.padding,
      backgroundColor: theme.colors.primary.main,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 1,
      elevation: 5,
    },
  });
