import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TripsScreen() {
  const [activeTab, setActiveTab] = useState('Active'); // State for tabs
  const [searchExpanded, setSearchExpanded] = useState(false); // State for search bar
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width; // Get screen width
  const searchWidth = new Animated.Value(
    searchExpanded ? screenWidth * 0.85 : 40
  );

  const toggleSearch = () => {
    Animated.timing(searchWidth, {
      toValue: searchExpanded ? 40 : screenWidth * 0.8,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSearchExpanded(!searchExpanded));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Active':
        return <Text style={styles(theme).tabContent}>Active Trips</Text>;
      case 'Recent':
        return <Text style={styles(theme).tabContent}>Recent Trips</Text>;
      case 'Cancelled':
        return <Text style={styles(theme).tabContent}>Cancelled Trips</Text>;
      default:
        return <Text style={styles(theme).tabContent}>Select a tab</Text>;
    }
  };

  return (
    <SafeAreaView style={styles(theme).container}>
      {/* Single-Layer Header */}
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>Trips</Text>

        {/* Animated Search Bar */}
        <Animated.View style={[styles(theme).searchBar, { width: searchWidth }]}>
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
      </View>

      {/* Tabs Section */}
      <View style={styles(theme).tabs}>
        {['Active', 'Recent', 'Cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)} // Update active tab state
            style={[
              styles(theme).tabButton,
              activeTab === tab && styles(theme).activeTabButton, // Apply active button style
            ]}
          >
            <Text
              style={[
                styles(theme).tabText,
                activeTab === tab && styles(theme).activeTabText, // Apply active text style
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles(theme).fab}>
        <Ionicons name="add-outline" size={24} color={theme.colors.primary.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1A1A1A', // Background color
    },
    header: {
      paddingHorizontal: theme.spacing.layout.screen.padding,
      marginBottom: theme.spacing.layout.section.gap,
    },
    title: {
      ...theme.typography.heading.h1,
      color: '#FFFFFF', // Keep title white for contrast
      marginBottom: theme.spacing.inset.sm,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.spacing.inset.sm * 2, // Rounded shape
      height: 36, // Adjust height for better proportions
      overflow: 'hidden',
      backgroundColor: '#2C2C2C', // Subtle contrast for search bar
    },
    searchIcon: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.inset.sm,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: theme.spacing.inset.sm,
      paddingVertical: 4, // Add padding to ensure the text is not clipped
      height: 36, // Ensure the height matches the container
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },    
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginBottom: theme.spacing.layout.section.padding,
    },
    tabButton: { paddingVertical: theme.spacing.inline.sm },
    activeTabButton: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary.main, // Orange for active tab
    },
    tabText: {
      ...theme.typography.button.medium,
      color: theme.colors.content.secondary,
    },
    activeTabText: {
      color: theme.colors.primary.main, // Use orange for active text
      fontWeight: theme.typography.button.medium.fontWeight,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabContent: {
      ...theme.typography.body.large,
      color: theme.colors.content.secondary,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.layout.section.padding,
      right: theme.spacing.layout.section.padding,
      backgroundColor: theme.colors.primary.main,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
  });
