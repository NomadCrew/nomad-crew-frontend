import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import type { PlaceDetailsWithFullText } from '@/src/types/places';
import { AutocompleteRow } from '@/components/shared/AutocompleteRow';

interface PlacesAutocompleteProps {
  onPlaceSelected: (details: PlaceDetailsWithFullText) => void;
  placeholder?: string;
  initialValue?: string;
  country?: string | string[];
}

// Define a simpler direct implementation for debugging
export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  initialValue = '',
  country,
}: PlacesAutocompleteProps) {
  const theme = useTheme();
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get platform-specific API key
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
    android: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID,
    default: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
  });

  // Log API key info once on mount
  useEffect(() => {
    console.log(`[Places API Debug] Platform: ${Platform.OS}`);
    console.log(`[Places API Debug] API Key available: ${!!apiKey}`);
    console.log(`[Places API Debug] API Key value: ${apiKey?.substring(0, 10)}...`);
    setQuery(initialValue);
  }, [initialValue]);

  // Function to search places
  const searchPlaces = async (text: string) => {
    if (!apiKey || text.length < 2) {
      setPredictions([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`[Places API Debug] Searching for: "${text}"`);
      
      // Create the direct API URL for autocomplete
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}&language=en&types=geocode|establishment${country ? `&components=country:${country}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log(`[Places API Debug] Found ${data.predictions.length} predictions`);
        setPredictions(data.predictions);
      } else {
        console.warn(`[Places API Debug] API status: ${data.status}`);
        if (data.error_message) {
          console.error(`[Places API Debug] Error: ${data.error_message}`);
        }
        setPredictions([]);
      }
    } catch (error) {
      console.error('[Places API Debug] Search failed:', error);
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
      console.log(`[Places API Debug] Getting details for place ID: ${placeId}`);
      
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,place_id,geometry,formatted_address,address_components`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('[Places API Debug] Got place details');
        const details = data.result;
        
        const placeDetails: PlaceDetailsWithFullText = {
          addressComponents: details.address_components?.map((component: any) => component.long_name) || [],
          coordinate: {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng
          },
          formattedAddress: details.formatted_address,
          name: details.name,
          placeId: details.place_id,
          fullText: description
        };
        
        onPlaceSelected(placeDetails);
        setQuery(details.formatted_address || description);
        setPredictions([]);
      } else {
        console.warn(`[Places API Debug] API status: ${data.status}`);
      }
    } catch (error) {
      console.error('[Places API Debug] Get details failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) {
    console.error('Google Places API key is missing');
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Google Places API key is missing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.textInput, { 
          color: theme.colors.onSurface,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline
        }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.outline}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          searchPlaces(text);
        }}
      />
      
      {predictions.length > 0 && (
        <View style={[styles.listContainer, { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.outline 
        }]}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.predictionItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => handlePlaceSelect(item.place_id, item.description)}
              >
                <Text style={{ color: theme.colors.onSurface }}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.primary }}>Loading...</Text>
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
    borderBottomColor: '#eee',
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
  }
});