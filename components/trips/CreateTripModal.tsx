import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Alert, ScrollView, Dimensions } from 'react-native';
import { Portal, Modal, Text as PaperText, Button, useTheme, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/types/trip';
import { PlaceDetailsWithFullText } from '@/src/types/places';
import CustomPlacesAutocomplete from '@/components/PlacesAutocomplete';

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tripData: Trip) => Promise<void>;
}

export default function CreateTripModal({
  visible,
  onClose,
  onSubmit,
}: CreateTripModalProps) {
  const theme = useTheme();
  const authStore = useAuthStore();
  
  // Initialize trip data with defaults
  const [trip, setTrip] = useState<Partial<Trip>>({
    id: '',
    name: '',
    destination: { address: '', placeId: '', coordinates: undefined },
    description: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'PLANNING',
    createdBy: authStore.user?.id || '',
  });

  // Date picker visibility state
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle date selection
  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    if (!selectedDate || !showDatePicker) return;

    const dateKey = showDatePicker === 'start' ? 'startDate' : 'endDate';
    setTrip((prev) => ({ ...prev, [dateKey]: selectedDate.toISOString() }));
  }

  // Form validation
  function validateForm() {
    if (!trip.name?.trim()) {
      Alert.alert('Validation Error', 'Please enter a trip name.');
      return false;
    }
    if (!trip.destination?.address?.trim()) {
      Alert.alert('Validation Error', 'Please select a valid destination.');
      return false;
    }
    if (trip.startDate && trip.endDate && new Date(trip.endDate) < new Date(trip.startDate)) {
      Alert.alert('Validation Error', 'End date must be after start date.');
      return false;
    }
    return true;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get a random inspirational quote
      const quotes = [
        "The journey of a thousand miles begins with a single step. - Lao Tzu",
        "Travel far, travel wide, travel deep. - Unknown",
        "Adventure is worthwhile. - Aesop",
        "Wherever you go, go with all your heart. - Confucius",
        "Not all who wander are lost. - J.R.R. Tolkien",
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      await onSubmit(trip as Trip);
      Alert.alert('Trip Created!', `Your trip to ${trip.destination?.address} is ready!\n\n${randomQuote}`);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle place selection from autocomplete
  function handlePlaceSelected(details: PlaceDetailsWithFullText) {    
    console.log('Place selected:', details.name || details.formattedAddress);
    
    if (!details || !details.placeId) {
      Alert.alert('Error', 'Please select a valid destination');
      return;
    }
    
    setTrip(prev => ({
      ...prev,
      destination: {
        address: details.formattedAddress || details.name,
        placeId: details.placeId,
        coordinates: details.coordinate ? {
          lat: details.coordinate.latitude,
          lng: details.coordinate.longitude
        } : undefined
      }
    }));
  }

  // Format dates for display
  const formattedStartDate = trip.startDate ? format(new Date(trip.startDate), 'MMM dd, yyyy') : '';
  const formattedEndDate = trip.endDate ? format(new Date(trip.endDate), 'MMM dd, yyyy') : '';

  const windowHeight = Dimensions.get('window').height;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalOuterContainer}
      >
        {/* Full-screen tappable background */}
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        />
        
        {/* Modal content */}
        <View 
          style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.colors.background,
              height: windowHeight * 0.7 // Limit height to 70% of screen
            }
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <PaperText variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              New Trip
            </PaperText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <PaperText style={{ fontSize: 18, color: theme.colors.onSurfaceVariant }}>✕</PaperText>
            </Pressable>
          </View>
          
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Trip name field */}
            <TextInput
              mode="outlined"
              label="Trip Name"
              placeholder="Trip Name"
              value={trip.name}
              onChangeText={(text) => setTrip((prev) => ({ ...prev, name: text }))}
              style={styles.textInput}
            />

            {/* Destination search in its own container with higher z-index */}
            <View style={styles.autocompleteWrapperOuter}>
              <View style={styles.autocompleteWrapper}>
                <CustomPlacesAutocomplete
                  placeholder="Search Destination"
                  onPlaceSelected={handlePlaceSelected}
                  initialValue={trip.destination?.address || ''}
                />
              </View>
            </View>

            {/* Scrollable content */}
            <ScrollView 
              style={[styles.scrollView, { marginTop: 12 }]}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Description field */}
              <TextInput
                mode="outlined"
                label="Description"
                placeholder="Description"
                value={trip.description}
                onChangeText={(text) => setTrip((prev) => ({ ...prev, description: text }))}
                multiline={true}
                numberOfLines={4}
                style={[styles.textInput, { height: 100 }]}
              />

              {/* Date picker row */}
              <View style={styles.dateRow}>
                <View style={[styles.dateField, { marginRight: 8 }]}>
                  <PaperText variant="labelMedium" style={{ marginBottom: 4, color: theme.colors.onSurface }}>
                    Start Date
                  </PaperText>
                  <Pressable
                    onPress={() => setShowDatePicker('start')}
                    style={[styles.dateDisplay, { 
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface
                    }]}
                  >
                    <PaperText style={{ color: theme.colors.onSurface }}>
                      {formattedStartDate}
                    </PaperText>
                  </Pressable>
                </View>

                <View style={styles.dateField}>
                  <PaperText variant="labelMedium" style={{ marginBottom: 4, color: theme.colors.onSurface }}>
                    End Date
                  </PaperText>
                  <Pressable
                    onPress={() => setShowDatePicker('end')}
                    style={[styles.dateDisplay, { 
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface
                    }]}
                  >
                    <PaperText style={{ color: theme.colors.onSurface }}>
                      {formattedEndDate}
                    </PaperText>
                  </Pressable>
                </View>
              </View>

              {/* Date picker */}
              {showDatePicker && trip.startDate && trip.endDate ? (
                <DateTimePicker
                  value={
                    showDatePicker === 'start'
                      ? new Date(trip.startDate)
                      : new Date(trip.endDate)
                  }
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={
                    showDatePicker === 'end'
                      ? new Date(trip.startDate)
                      : undefined
                  }
                />
              ) : null}

              {/* Submit button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={[styles.submitButton, { backgroundColor: '#FF8A01' }]}
                labelStyle={{ color: '#FFFFFF' }}
              >
                Create Trip
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalOuterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    padding: 16,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  textInput: {
    marginTop: 12,
  },
  autocompleteWrapperOuter: {
    position: 'relative',
    zIndex: 9999,
    elevation: 999,
    marginTop: 12,
  },
  autocompleteWrapper: {
    position: 'relative',
    zIndex: 9999,
    elevation: 999,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 16,
    zIndex: 1,
  },
  dateField: {
    flex: 1,
  },
  dateDisplay: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 6,
  }
});