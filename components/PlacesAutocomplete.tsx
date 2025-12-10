import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { PlaceDetailsWithFullText } from '@/src/types/places';

// Note: GooglePlacesAutocomplete and AutocompleteRow are not used in this implementation.
// This component uses a custom implementation that directly calls the Google Places API
// for better control over the autocomplete behavior and styling.

interface PlacesAutocompleteProps {
  onPlaceSelected: (details: PlaceDetailsWithFullText) => void;
  placeholder?: string;
  initialValue?: string;
  country?: string | string[];
}

/**
 * An embeddable Google Places autocomplete input that fetches suggestions and place details directly from the Places API.
 *
 * Renders a text input that queries the Places Autocomplete API as the user types, displays selectable predictions, and invokes `onPlaceSelected` with detailed place information when an item is chosen.
 *
 * @param onPlaceSelected - Callback invoked with full place details (`PlaceDetailsWithFullText`) after a prediction is selected.
 * @param placeholder - Placeholder text for the input (defaults to 'Search...').
 * @param initialValue - Initial input value (defaults to an empty string).
 * @param country - Optional country code or list of country codes to restrict autocomplete results.
 * @returns The autocomplete React component UI for searching and selecting places.
 */
export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  initialValue = '',
  country,
}: PlacesAutocompleteProps) {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get platform-specific API key from environment variables
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS
      : process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID;

  // Function to search places
  const searchPlaces = async (text: string) => {
    if (!apiKey || text.length < 2) {
      setPredictions([]);
      return;
    }

    try {
      setIsLoading(true);

      // Handle country parameter: support both string and string[] types
      const componentsParam = !country
        ? ''
        : Array.isArray(country)
          ? `&components=${country.map((c) => `country:${c}`).join('|')}`
          : `&components=country:${country}`;

      // Create the direct API URL for autocomplete
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en&types=geocode|establishment${componentsParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        if (__DEV__) {
          console.log(`[Places API Debug] Found ${data.predictions.length} predictions`);
          data.predictions.forEach((prediction: any, idx: number) => {
            console.log(`[Places API Debug] Prediction #${idx + 1}:`, {
              description: prediction.description,
              place_id: prediction.place_id,
              main_text: prediction.structured_formatting?.main_text,
              secondary_text: prediction.structured_formatting?.secondary_text,
            });
          });
        }
        setPredictions(data.predictions);
      } else {
        if (__DEV__) {
          console.warn(`[Places API Debug] API status: ${data.status}`);
          if (data.error_message) {
            console.error(`[Places API Debug] Error: ${data.error_message}`);
          }
        }
        setPredictions([]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Places API Debug] Search failed:', error);
      }
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get place details when a place is selected
  const handlePlaceSelect = async (placeId: string, description: string) => {
    if (!apiKey) return;

    try {
      setIsLoading(true);
      if (__DEV__) {
        console.log(`[Places API Debug] Getting details for place ID: ${placeId}`);
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,place_id,geometry,formatted_address,address_components`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const details = data.result;
        if (__DEV__) {
          console.log('[Places API Debug] Got place details', details);
        }

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
          fullText: description,
        };

        onPlaceSelected(placeDetails);
        setQuery(details.formatted_address || description);
        setPredictions([]);
      } else {
        if (__DEV__) {
          console.warn(`[Places API Debug] API status: ${data.status}`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Places API Debug] Get details failed:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) {
    console.error('Google Places API key is missing');
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.colors.status.error.main }}>
          Google Places API key is missing
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.textInput,
          {
            color: theme.colors.content.onSurface,
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.border.default}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          searchPlaces(text);
        }}
      />

      {predictions.length > 0 && (
        <View
          style={[
            styles.listContainer,
            {
              backgroundColor: theme.colors.background.default,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.predictionItem,
                  {
                    backgroundColor: theme.colors.surface.default,
                    borderBottomColor: theme.colors.border.default,
                  },
                ]}
                onPress={() => handlePlaceSelect(item.place_id, item.description)}
              >
                <Text style={{ color: theme.colors.content.onSurface }}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isLoading && (
        <View
          style={[styles.loadingContainer, { backgroundColor: theme.colors.background.default }]}
        >
          <Text style={{ color: theme.colors.primary.main }}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    width: '100%',
    zIndex: 9999,
    elevation: 999,
    position: 'relative',
  },
  textInput: {
    height: 56,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  listContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 4,
    zIndex: 10000,
    elevation: 1000,
  },
  predictionItem: {
    padding: 15,
    borderBottomWidth: 1,
    // borderBottomColor is applied dynamically in renderItem to use theme colors
  },
  loadingContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
    zIndex: 10001,
    elevation: 1001,
  },
});
