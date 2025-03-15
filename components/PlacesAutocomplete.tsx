import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import PlacesAutocomplete from 'expo-google-places-autocomplete';
import type { Place } from 'expo-google-places-autocomplete';
import type { PlaceDetailsWithFullText } from '@/src/types/places';
import debounce from 'lodash.debounce';

// Debug prefix to easily identify logs from this component
const DEBUG_PREFIX = '🔍 PlacesAutocomplete:';

// Add country code type definition
type CountryCode = 
  | 'AF' | 'AX' | 'AL' | 'DZ' | 'AS' | 'AD' | 'AO' | 'AI' | 'AQ' | 'AG' | 'AR'
  | 'AM' | 'AW' | 'AU' | 'AT' | 'AZ' | 'BS' | 'BH' | 'BD' | 'BB' | 'BY' | 'BE'
  | 'BZ' | 'BJ' | 'BM' | 'BT' | 'BO' | 'BQ' | 'BA' | 'BW' | 'BV' | 'BR' | 'IO'
  | 'BN' | 'BG' | 'BF' | 'BI' | 'CV' | 'KH' | 'CM' | 'CA' | 'KY' | 'CF' | 'TD'
  | 'CL' | 'CN' | 'CX' | 'CC' | 'CO' | 'KM' | 'CG' | 'CD' | 'CK' | 'CR' | 'CI'
  | 'HR' | 'CU' | 'CW' | 'CY' | 'CZ' | 'DK' | 'DJ' | 'DM' | 'DO' | 'EC' | 'EG'
  | 'SV' | 'GQ' | 'ER' | 'EE' | 'SZ' | 'ET' | 'FK' | 'FO' | 'FJ' | 'FI' | 'FR'
  | 'GF' | 'PF' | 'TF' | 'GA' | 'GM' | 'GE' | 'DE' | 'GH' | 'GI' | 'GR' | 'GL'
  | 'GD' | 'GP' | 'GU' | 'GT' | 'GG' | 'GN' | 'GW' | 'GY' | 'HT' | 'HM' | 'VA'
  | 'HN' | 'HK' | 'HU' | 'IS' | 'IN' | 'ID' | 'IR' | 'IQ' | 'IE' | 'IM' | 'IL'
  | 'IT' | 'JM' | 'JP' | 'JE' | 'JO' | 'KZ' | 'KE' | 'KI' | 'KP' | 'KR' | 'KW'
  | 'KG' | 'LA' | 'LV' | 'LB' | 'LS' | 'LR' | 'LY' | 'LI' | 'LT' | 'LU' | 'MO'
  | 'MG' | 'MW' | 'MY' | 'MV' | 'ML' | 'MT' | 'MH' | 'MQ' | 'MR' | 'MU' | 'YT'
  | 'MX' | 'FM' | 'MD' | 'MC' | 'MN' | 'ME' | 'MS' | 'MA' | 'MZ' | 'MM' | 'NA'
  | 'NR' | 'NP' | 'NL' | 'NC' | 'NZ' | 'NI' | 'NE' | 'NG' | 'NU' | 'NF' | 'MK'
  | 'MP' | 'NO' | 'OM' | 'PK' | 'PW' | 'PS' | 'PA' | 'PG' | 'PY' | 'PE' | 'PH'
  | 'PN' | 'PL' | 'PT' | 'PR' | 'QA' | 'RE' | 'RO' | 'RU' | 'RW' | 'BL' | 'SH'
  | 'KN' | 'LC' | 'MF' | 'PM' | 'VC' | 'WS' | 'SM' | 'ST' | 'SA' | 'SN' | 'RS'
  | 'SC' | 'SL' | 'SG' | 'SX' | 'SK' | 'SI' | 'SB' | 'SO' | 'ZA' | 'GS' | 'SS'
  | 'ES' | 'LK' | 'SD' | 'SR' | 'SJ' | 'SE' | 'CH' | 'SY' | 'TW' | 'TJ' | 'TZ'
  | 'TH' | 'TL' | 'TG' | 'TK' | 'TO' | 'TT' | 'TN' | 'TR' | 'TM' | 'TC' | 'TV'
  | 'UG' | 'UA' | 'AE' | 'GB' | 'US' | 'UM' | 'UY' | 'UZ' | 'VU' | 'VE' | 'VN'
  | 'VG' | 'VI' | 'WF' | 'EH' | 'YE' | 'ZM' | 'ZW';

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

// Update the interface to match RequestConfig
interface PlacesAutocompleteOptions {
  sessionToken: string;  // Remove optional
  language: string;      // Remove optional
  types: string[];      // Remove optional
  countries: CountryCode[];  // Remove optional
  strictbounds: boolean; // Remove optional
  location?: {          // Keep this optional as it's a complex object
    latitude: number;
    longitude: number;
  };
  radius?: number;      // Keep this optional as it's a simple value
}

export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  styles: customStyles = {},
}: PlacesAutocompleteProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiInitialized, setHasApiInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Generate a session token for the Places API
  useEffect(() => {
    // Generate a random session token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    setSessionToken(token);
  }, []);

  // Initialize the Places API once when the component mounts
  useEffect(() => {
    const initPlacesApi = async () => {
      try {
        // Get platform-specific API key
        const apiKey = Platform.select({
          ios: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
          android: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID,
          default: undefined
        });

        // Debug logging
        console.log('Platform:', Platform.OS);
        console.log('API Key:', apiKey ? 'Present' : 'Missing'); 
          
        if (!apiKey) {
          throw new Error(`Google API key is missing for ${Platform.OS}`);
        }
        
        await PlacesAutocomplete.initPlaces(apiKey);
        setHasApiInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Places API:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        
        // Alert the user only in development
        if (__DEV__) {
          Alert.alert(
            'Places API Error', 
            `Failed to initialize Google Places API: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    };
    
    initPlacesApi();
  }, []);

  // Create a memoized debounced search function with improved error handling
  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (!hasApiInitialized) {
        return;
      }
      
      setIsLoading(true);
      try {
        // Creating options with required fields
        const options: PlacesAutocompleteOptions = {
          sessionToken: sessionToken || '',  // Provide empty string if null
          language: 'en',
          types: ['geocode', 'establishment'],  // Common types for place search
          countries: [],  // Empty array as default
          strictbounds: false,  // Default value
        };
        
        const result = await PlacesAutocomplete.findPlaces(text, options) as PlacesSearchResult;
        
        if (result && result.places) {
          setResults(result.places);
        } else {
          // If result is an array directly (some versions of the API might return this way)
          if (Array.isArray(result)) {
            setResults(result as unknown as Place[]);
          } else {
            setResults([]);
          }
        }
      } catch (error) {
        console.error('Error searching places:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        
        // Show error to user in development mode
        if (__DEV__) {
          Alert.alert(
            'Places Search Error', 
            'Failed to search places. This could be due to API key issues or network problems.'
          );
        }
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [hasApiInitialized, sessionToken]
  );

  // Create a memoized handle search function
  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    
    if (text.trim().length > 2) {
      debouncedSearch(text);
    } else {
      setResults([]);
    }
  }, [debouncedSearch]);

  // Create a memoized handle select function
  const handleSelect = useCallback(async (place: Place) => {
    try {
      // Set the input value to the selected place's full text
      setQuery(place.fullText);
      // Clear results immediately for better UX
      setResults([]);
      setIsLoading(true);
      
      const details = await PlacesAutocomplete.placeDetails(place.placeId);
      
      const placeDetails = {
        ...details,
        formattedAddress: details.formattedAddress || place.fullText,
        fullText: place.fullText
      } as PlaceDetailsWithFullText;
      
      onPlaceSelected(placeDetails);
    } catch (error) {
      console.error('Error fetching place details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      if (__DEV__) {
        Alert.alert('Error', 'Failed to get place details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onPlaceSelected]);

  // Memoize the styles based on the theme to prevent recalculation on every render
  const memoizedStyles = useMemo(() => ({
    resultsContainer: [
      styles.resultsContainer, 
      { backgroundColor: theme.colors.background }
    ],
    resultItemPressed: [
      styles.resultItem,
      { backgroundColor: theme.colors.surfaceVariant }
    ],
    resultItemNormal: [
      styles.resultItem,
      { backgroundColor: theme.colors.background }
    ]
  }), [theme.colors]);

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
        <View 
          style={memoizedStyles.resultsContainer}
          // This forces view to render on top of other elements on iOS
          pointerEvents="box-none"
        >
          {results.map((place, index) => (
            <Pressable
              key={`${place.placeId}-${index}`}
              onPress={() => handleSelect(place)}
              style={({ pressed }) => 
                pressed 
                  ? [memoizedStyles.resultItemPressed, customStyles.resultItem]
                  : [memoizedStyles.resultItemNormal, customStyles.resultItem]
              }
            >
              <Text style={{ color: theme.colors.onSurface }}>{place.fullText}</Text>
            </Pressable>
          ))}
        </View>
      )}
      
      {isLoading && results.length === 0 && query.trim().length > 2 && (
        <View style={[memoizedStyles.resultsContainer, { padding: 12 }]}>
          <Text>Searching...</Text>
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
    zIndex: Platform.OS === 'ios' ? 9999 : 1000, // Higher z-index for iOS
    elevation: Platform.OS === 'android' ? 3 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, // Increased opacity for better visibility
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