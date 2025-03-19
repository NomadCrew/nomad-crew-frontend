import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import type { PlaceDetailsWithFullText, Coordinate } from '@/src/types/places';

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

export default function CustomPlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search...',
  styles: customStyles = {},
}: PlacesAutocompleteProps) {
  const theme = useTheme();
  const googlePlacesRef = useRef(null);
  const [query, setQuery] = useState('');

  // Get platform-specific API key
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
    android: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID,
    default: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
  });

  // Memoize the styles based on the theme to prevent recalculation on every render
  const memoizedStyles = useMemo(() => ({
    container: [
      styles.container,
      customStyles.container
    ],
    textInputContainer: {
      backgroundColor: theme.colors.background,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      paddingHorizontal: 0,
    },
    textInput: [
      styles.input,
      customStyles.input,
      {
        height: 56,
        color: theme.colors.onSurface,
        fontSize: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 4,
      }
    ],
    listView: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 4,
      elevation: 3,
    },
    row: {
      backgroundColor: theme.colors.background,
      padding: 13,
      height: 'auto',
      flexDirection: 'row',
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    description: {
      color: theme.colors.onSurface,
      fontSize: 14,
    },
    poweredContainer: {
      backgroundColor: theme.colors.background,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
      borderColor: theme.colors.outline,
      borderTopWidth: 0.5,
    },
  }), [theme.colors, customStyles]);

  if (!apiKey) {
    console.error('Google Places API key is missing');
    return (
      <View style={memoizedStyles.container}>
        <TextInput
          mode="outlined"
          placeholder={placeholder}
          value="API key missing"
          disabled
          style={memoizedStyles.textInput}
        />
      </View>
    );
  }

  return (
    <View style={memoizedStyles.container}>
      <GooglePlacesAutocomplete
        ref={googlePlacesRef}
        placeholder={placeholder}
        onPress={(data, details = null) => {
          if (details) {
            // Convert Google Places API response to our app's format
            const coordinate: Coordinate = {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng
            };
            
            const placeDetails: PlaceDetailsWithFullText = {
              addressComponents: details.address_components?.map(component => component.long_name) || [],
              coordinate,
              formattedAddress: details.formatted_address || data.description,
              name: details.name || data.structured_formatting?.main_text || '',
              placeId: details.place_id,
              fullText: data.description
            };
            
            onPlaceSelected(placeDetails);
          }
        }}
        query={{
          key: apiKey,
          language: 'en',
          types: 'geocode|establishment',
        }}
        fetchDetails={true}
        enablePoweredByContainer={true}
        debounce={300}
        styles={memoizedStyles}
        textInputProps={{
          placeholderTextColor: theme.colors.outline,
          clearButtonMode: 'while-editing',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    width: '100%',
    zIndex: 1,
  },
  input: {
    width: '100%',
    marginBottom: 5,
  },
  resultsContainer: {
    maxHeight: 200,
    width: '100%',
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 2,
    position: 'absolute',
    top: 60,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  resultText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
}); 