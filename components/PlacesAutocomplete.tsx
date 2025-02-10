import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import PlacesAutocomplete from 'expo-google-places-autocomplete';
import type { Place } from 'expo-google-places-autocomplete';
import type { PlaceDetailsWithFullText } from '@/src/types/places';

interface PlacesAutocompleteProps {
    onPlaceSelected: (details: PlaceDetailsWithFullText) => void;
    placeholder?: string;
    styles?: {
      container?: object;
      input?: object;
      resultItem?: object;
    };
}

interface PlacesSearchResult {
    places: Place[];
  }

export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  styles: customStyles = {},
}: PlacesAutocompleteProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => {
    PlacesAutocomplete.initPlaces(process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY!);
  }, []);

  const handleSearch = async (text: string) => {
    setQuery(text);
    try {
      const result = await PlacesAutocomplete.findPlaces(text) as PlacesSearchResult;
      console.log('Places search result:', result);
      setResults(result.places);
    } catch (error) {
      console.error('Places search error:', error);
    }
  };

  const handleSelect = async (place: Place) => {
    try {
      // Set the input value to the selected place's full text
      setQuery(place.fullText);
      // Clear results immediately for better UX
      setResults([]);
      const details = await PlacesAutocomplete.placeDetails(place.placeId);
      // Log in handleSelect before calling onPlaceSelected:
      console.log('Full details object:', JSON.stringify(details, null, 2));
      onPlaceSelected({
        ...details,
        formattedAddress: details.formattedAddress || place.fullText,
        fullText: place.fullText
      } as PlaceDetailsWithFullText);
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <View style={[styles.container, customStyles.container]}>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={query}
        onChangeText={handleSearch}
        style={[styles.input, customStyles.input]}
        theme={{
          colors: {
            placeholder: theme.colors.outline,
            text: theme.colors.onSurface,
            primary: theme.colors.primary,
          }
        }}
      />

      {results.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.colors.background }]}>
          {results.map((place, index) => (
            <Pressable
              key={`${place.placeId}-${index}`}
              onPress={() => handleSelect(place)}
              style={({ pressed }) => [
                styles.resultItem,
                { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.background },
                customStyles.resultItem
              ]}
            >
              <Text style={{ color: theme.colors.onSurface }}>{place.fullText}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
  },
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 4,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 