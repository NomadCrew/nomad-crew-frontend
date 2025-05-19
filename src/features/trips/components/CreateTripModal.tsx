import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Alert, ScrollView, Dimensions } from 'react-native';
import { Portal, Modal, Button, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types';
import { PlaceDetailsWithFullText } from '@/src/types/places';
import CustomPlacesAutocomplete from '@/components/PlacesAutocomplete';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useAppTheme } from '@/src/theme/ThemeProvider';

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
  const theme = useAppTheme().theme;
  const authStore = useAuthStore();
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
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (!selectedDate || !showDatePicker) return;
    const dateKey = showDatePicker === 'start' ? 'startDate' : 'endDate';
    setTrip((prev) => ({ ...prev, [dateKey]: selectedDate.toISOString() }));
  }

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

  async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    try {
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

  function handlePlaceSelected(details: PlaceDetailsWithFullText) {
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close modal background" />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background, height: windowHeight * 0.7 }]}> 
          {/* Drag handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>
          {/* Header */}
          <View style={styles.headerRow}>
            <ThemedText variant="title.large" color="content.primary" style={{ flex: 1 }}>New Trip</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close modal">
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.content.secondary} />
            </Pressable>
          </View>
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Trip name field */}
            <ThemedText variant="label.medium" color="content.secondary" style={styles.label}>Trip Name</ThemedText>
            <TextInput
              mode="outlined"
              placeholder="Trip Name"
              value={trip.name}
              onChangeText={(text) => setTrip((prev) => ({ ...prev, name: text }))}
              style={styles.textInput}
              accessibilityLabel="Trip Name"
              autoFocus
              returnKeyType="next"
            />
            {/* Destination search */}
            <ThemedText variant="label.medium" color="content.secondary" style={styles.label}>Destination</ThemedText>
            <View style={styles.autocompleteWrapperOuter}>
              <View style={styles.autocompleteWrapper}>
                <CustomPlacesAutocomplete
                  placeholder="Search Destination"
                  onPlaceSelected={handlePlaceSelected}
                  initialValue={trip.destination?.address || ''}
                />
              </View>
            </View>
            {/* Description field */}
            <ThemedText variant="label.medium" color="content.secondary" style={styles.label}>Description</ThemedText>
            <TextInput
              mode="outlined"
              placeholder="Description"
              value={trip.description}
              onChangeText={(text) => setTrip((prev) => ({ ...prev, description: text }))}
              multiline={true}
              numberOfLines={4}
              style={[styles.textInput, { height: 100 }]}
              accessibilityLabel="Description"
            />
            {/* Date picker row */}
            <View style={styles.dateRow}>
              <View style={[styles.dateField, { marginRight: 8 }]}> 
                <ThemedText variant="label.medium" color="content.secondary" style={styles.label}>Start Date</ThemedText>
                <Pressable
                  onPress={() => setShowDatePicker('start')}
                  style={[styles.dateDisplay, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                  accessibilityLabel="Select start date"
                >
                  <View style={styles.dateDisplayContent}>
                    <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <ThemedText color="content.primary">{formattedStartDate}</ThemedText>
                  </View>
                </Pressable>
              </View>
              <View style={styles.dateField}>
                <ThemedText variant="label.medium" color="content.secondary" style={styles.label}>End Date</ThemedText>
                <Pressable
                  onPress={() => setShowDatePicker('end')}
                  style={[styles.dateDisplay, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                  accessibilityLabel="Select end date"
                >
                  <View style={styles.dateDisplayContent}>
                    <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <ThemedText color="content.primary">{formattedEndDate}</ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>
            {/* Date picker */}
            {showDatePicker && trip.startDate && trip.endDate ? (
              <DateTimePicker
                value={showDatePicker === 'start' ? new Date(trip.startDate) : new Date(trip.endDate)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            ) : null}
          </View>
          {/* Submit button */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={[styles.submitButton, { backgroundColor: theme.colors.primary.main }]}
              labelStyle={[styles.submitButtonLabel, { color: theme.colors.primary.onPrimary }]}
              accessibilityLabel="Create Trip"
              contentStyle={{ height: 48 }}
            >
              Create Trip
            </Button>
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
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  label: {
    marginBottom: 4,
    marginLeft: 2,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  autocompleteWrapperOuter: {},
  autocompleteWrapper: {},
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateDisplay: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    minHeight: 50,
  },
  dateDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    borderRadius: 30,
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 