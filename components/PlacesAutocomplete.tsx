import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { AutocompleteDropdown, AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import type { PlaceDetailsWithFullText } from '@/src/types/places';

interface PlacesAutocompleteProps {
  onPlaceSelected: (details: PlaceDetailsWithFullText) => void;
  placeholder?: string;
  initialValue?: string;
  country?: string | string[];
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Google Places autocomplete using react-native-autocomplete-dropdown.
 * Must be rendered inside an AutocompleteDropdownContextProvider to avoid
 * VirtualizedList nesting conflicts with parent ScrollViews.
 */
export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  initialValue = '',
  country,
}: PlacesAutocompleteProps) {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteDropdownItem[]>([]);
  const predictionsRef = useRef<PlacePrediction[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownController = useRef<any>(null);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  const searchPlaces = useCallback(
    async (text: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!apiKey || text.length < 2) {
        setSuggestions([]);
        predictionsRef.current = [];
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const componentsParam = !country
            ? ''
            : Array.isArray(country)
              ? `&components=${country.map((c) => `country:${c}`).join('|')}`
              : `&components=country:${country}`;

          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en&types=geocode|establishment${componentsParam}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.status === 'OK') {
            predictionsRef.current = data.predictions;
            setSuggestions(
              data.predictions.map((p: PlacePrediction) => ({
                id: p.place_id,
                title: p.description,
              }))
            );
          } else {
            predictionsRef.current = [];
            setSuggestions([]);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('[Places API] Search failed:', error);
          }
          predictionsRef.current = [];
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [apiKey, country]
  );

  const handleSelect = useCallback(
    async (item: AutocompleteDropdownItem | null) => {
      if (!item || !apiKey) return;

      const prediction = predictionsRef.current.find((p) => p.place_id === item.id);
      if (!prediction) return;

      setLoading(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${apiKey}&fields=name,place_id,geometry,formatted_address,address_components`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
          const details = data.result;
          const placeDetails: PlaceDetailsWithFullText = {
            addressComponents:
              details.address_components?.map((component: any) => component.long_name) || [],
            coordinate: {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            },
            formattedAddress: details.formatted_address,
            name: details.name,
            placeId: details.place_id,
            fullText: prediction.description,
          };

          onPlaceSelected(placeDetails);
          setSuggestions([]);
          predictionsRef.current = [];
        }
      } catch (error) {
        if (__DEV__) {
          console.error('[Places API] Get details failed:', error);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiKey, onPlaceSelected]
  );

  const handleClear = useCallback(() => {
    setSuggestions([]);
    predictionsRef.current = [];
  }, []);

  const themedStyles = createStyles(theme);

  if (!apiKey) {
    console.error('Google Places API key is missing');
    return null;
  }

  return (
    <View style={themedStyles.container}>
      <AutocompleteDropdown
        controller={(controller) => {
          dropdownController.current = controller;
        }}
        initialValue={initialValue ? { id: 'initial', title: initialValue } : undefined}
        dataSet={suggestions}
        onChangeText={searchPlaces}
        onSelectItem={handleSelect}
        onClear={handleClear}
        loading={loading}
        useFilter={false}
        textInputProps={{
          placeholder,
          autoCapitalize: 'none',
          autoCorrect: false,
          style: themedStyles.textInput,
          placeholderTextColor: theme.colors.content.tertiary,
        }}
        inputContainerStyle={themedStyles.inputContainer}
        suggestionsListContainerStyle={themedStyles.suggestionsContainer}
        containerStyle={themedStyles.dropdownContainer}
        inputHeight={50}
        showChevron={false}
        closeOnBlur={true}
        showClear={true}
        clearOnFocus={false}
        debounce={0}
        emptyResultText="Type to search places..."
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
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
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: 4,
    },
    textInput: {
      color: theme.colors.content.onSurface,
      fontSize: 16,
      paddingHorizontal: 12,
    },
    suggestionsContainer: {
      backgroundColor: theme.colors.surface.default,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      marginTop: 4,
    },
  });
