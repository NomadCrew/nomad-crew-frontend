import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { AutocompleteDropdown, AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { searchUsers, UserSearchResult } from '@/src/api/api-client';
import { User, Mail } from 'lucide-react-native';

interface UserAutocompleteProps {
  tripId?: string;
  onUserSelected: (user: UserSearchResult) => void;
  onManualEmail: (email: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
}

// Custom dropdown item with avatar, name, and email
const DropdownItem = memo(
  ({
    item,
    theme,
  }: {
    item: AutocompleteDropdownItem & { user?: UserSearchResult };
    theme: Theme;
  }) => {
    const user = item.user;
    if (!user) {
      // Manual email entry option
      return (
        <View style={styles(theme).itemContainer}>
          <View style={styles(theme).avatarPlaceholder}>
            <Mail size={20} color={theme.colors.content.tertiary} />
          </View>
          <View style={styles(theme).itemTextContainer}>
            <Text style={styles(theme).itemTitle}>Invite by email</Text>
            <Text style={styles(theme).itemSubtitle}>{item.title}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[styles(theme).itemContainer, user.isMember && styles(theme).itemContainerDisabled]}
      >
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles(theme).avatar} />
        ) : (
          <View style={styles(theme).avatarPlaceholder}>
            <User size={20} color={theme.colors.content.tertiary} />
          </View>
        )}
        <View style={styles(theme).itemTextContainer}>
          <View style={styles(theme).nameRow}>
            <Text style={styles(theme).itemTitle} numberOfLines={1}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || user.email}
            </Text>
            {user.isMember && (
              <View style={styles(theme).memberBadge}>
                <Text style={styles(theme).memberBadgeText}>Already member</Text>
              </View>
            )}
          </View>
          <Text style={styles(theme).itemSubtitle} numberOfLines={1}>
            @{user.username} • {user.contactEmail || user.email}
          </Text>
        </View>
      </View>
    );
  }
);

export const UserAutocomplete = ({
  tripId,
  onUserSelected,
  onManualEmail,
  placeholder = 'Search users or enter email',
  disabled = false,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}: UserAutocompleteProps) => {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    (AutocompleteDropdownItem & { user?: UserSearchResult })[]
  >([]);
  const [inputText, setInputText] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownController = useRef<any>(null);

  // Debounced search
  const handleSearch = useCallback(
    async (query: string) => {
      setInputText(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Don't search for short queries
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Debounce search by 300ms
      searchTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        console.log('[UserAutocomplete] Starting search for:', query);
        try {
          const results = await searchUsers(query, tripId, 10);
          console.log('[UserAutocomplete] Search results:', results);

          // Convert to dropdown items
          const items: (AutocompleteDropdownItem & { user?: UserSearchResult })[] = results.map(
            (user) => ({
              id: user.id,
              title: user.username || user.email,
              user,
            })
          );
          console.log('[UserAutocomplete] Converted items:', items);

          // If the query looks like an email and no exact match, add manual entry option
          const isEmailLike = query.includes('@') && query.includes('.');
          const exactEmailMatch = results.some(
            (r) =>
              r.email.toLowerCase() === query.toLowerCase() ||
              r.contactEmail?.toLowerCase() === query.toLowerCase()
          );

          if (isEmailLike && !exactEmailMatch) {
            items.push({
              id: 'manual-email',
              title: query,
              user: undefined,
            });
          }

          console.log('[UserAutocomplete] Setting suggestions:', items.length, 'items');
          setSuggestions(items);
        } catch (error) {
          console.error('[UserAutocomplete] Search failed:', error);
          // On error, allow manual email entry
          if (query.includes('@')) {
            setSuggestions([
              {
                id: 'manual-email',
                title: query,
                user: undefined,
              },
            ]);
          } else {
            setSuggestions([]);
          }
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [tripId]
  );

  const handleSelect = useCallback(
    (item: AutocompleteDropdownItem | null) => {
      if (!item) return;

      const selectedItem = suggestions.find((s) => s.id === item.id);

      if (selectedItem?.user) {
        // Don't allow selecting existing members
        if (selectedItem.user.isMember) {
          return;
        }
        onUserSelected(selectedItem.user);
      } else if (item.id === 'manual-email') {
        onManualEmail(item.title || inputText);
      }

      // Clear the input after selection
      setInputText('');
      setSuggestions([]);
      dropdownController.current?.clear();
    },
    [suggestions, inputText, onUserSelected, onManualEmail]
  );

  const handleClear = useCallback(() => {
    setInputText('');
    setSuggestions([]);
  }, []);

  const themedStyles = styles(theme);

  return (
    <View style={themedStyles.container}>
      <AutocompleteDropdown
        controller={(controller) => {
          dropdownController.current = controller;
        }}
        dataSet={suggestions}
        onChangeText={handleSearch}
        onSelectItem={handleSelect}
        onClear={handleClear}
        onFocus={onFocusProp}
        onBlur={onBlurProp}
        loading={loading}
        useFilter={false}
        textInputProps={{
          placeholder,
          autoCapitalize: 'none',
          autoCorrect: false,
          style: themedStyles.textInput,
          placeholderTextColor: theme.colors.content.tertiary,
          editable: !disabled,
        }}
        inputContainerStyle={[
          themedStyles.inputContainer,
          disabled && themedStyles.inputContainerDisabled,
        ]}
        suggestionsListContainerStyle={themedStyles.suggestionsContainer}
        containerStyle={themedStyles.dropdownContainer}
        renderItem={(item) => (
          <DropdownItem
            item={item as AutocompleteDropdownItem & { user?: UserSearchResult }}
            theme={theme}
          />
        )}
        inputHeight={50}
        showChevron={false}
        closeOnBlur={true}
        showClear={inputText.length > 0}
        clearOnFocus={false}
        debounce={0} // We handle debounce manually
        emptyResultText="Type to search users..."
      />
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      zIndex: 1000,
    },
    dropdownContainer: {
      flexGrow: 1,
      flexShrink: 1,
    },
    inputContainer: {
      backgroundColor: theme.colors.background.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary.main,
      borderRadius: theme.borderRadius.md,
    },
    inputContainerDisabled: {
      opacity: 0.5,
    },
    textInput: {
      color: theme.colors.content.primary,
      fontSize: 16,
      paddingHorizontal: 12,
    },
    suggestionsContainer: {
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.surface.variant,
      marginTop: 4,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surface.variant,
    },
    itemContainerDisabled: {
      opacity: 0.5,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface.variant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemTextContainer: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginRight: 8,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.colors.content.secondary,
      marginTop: 2,
    },
    memberBadge: {
      backgroundColor: theme.colors.surface.variant,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    memberBadgeText: {
      fontSize: 11,
      color: theme.colors.content.tertiary,
      fontWeight: '500',
    },
  });

export default UserAutocomplete;
