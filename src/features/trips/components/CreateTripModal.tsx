import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Portal, Modal, Button, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
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
  onSubmit: (tripData: Trip) => Promise<Trip>;
}

export default function CreateTripModal({ visible, onClose, onSubmit }: CreateTripModalProps) {
  const theme = useAppTheme().theme;
  const { user: currentUser } = useAuthStore();
  const [trip, setTrip] = useState<Partial<Trip>>({
    id: '',
    name: '',
    destination: { address: '', placeId: '', coordinates: undefined },
    description: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'PLANNING',
    createdBy: currentUser?.id || '',
    members: currentUser?.id
      ? [
          {
            userId: currentUser.id,
            role: 'owner',
            name: currentUser.username || currentUser.email?.split('@')[0] || 'Owner',
            joinedAt: new Date().toISOString(),
          },
        ]
      : [],
    invitations: [],
  });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);

  // Temp date for iOS spinner — only committed on "Done"
  const [tempDate, setTempDate] = useState<Date>(new Date());

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
      if (event.type === 'dismissed' || !selectedDate || !showDatePicker) return;
      const dateKey = showDatePicker === 'start' ? 'startDate' : 'endDate';
      setTrip((prev) => ({ ...prev, [dateKey]: selectedDate.toISOString() }));
    } else {
      // iOS spinner: update temp date on scroll, commit on Done
      if (selectedDate) setTempDate(selectedDate);
    }
  }

  function handleIOSDateDone() {
    if (!showDatePicker) return;
    const dateKey = showDatePicker === 'start' ? 'startDate' : 'endDate';
    setTrip((prev) => ({ ...prev, [dateKey]: tempDate.toISOString() }));
    setShowDatePicker(null);
  }

  function openDatePicker(which: 'start' | 'end') {
    const current = which === 'start' ? new Date(trip.startDate!) : new Date(trip.endDate!);
    setTempDate(current);
    setShowDatePicker(which);
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

    const tripPayload: Partial<Trip> = {
      ...trip,
      createdBy: currentUser?.id || '',
    };

    if (currentUser && (!tripPayload.members || tripPayload.members.length === 0)) {
      tripPayload.members = [
        {
          userId: currentUser.id,
          role: 'owner',
          name: currentUser.username || currentUser.email?.split('@')[0] || 'Owner',
          joinedAt: new Date().toISOString(),
        },
      ];
    }
    if (!tripPayload.invitations) {
      tripPayload.invitations = [];
    }

    try {
      const quotes = [
        'The journey of a thousand miles begins with a single step. - Lao Tzu',
        'Travel far, travel wide, travel deep. - Unknown',
        'Adventure is worthwhile. - Aesop',
        'Wherever you go, go with all your heart. - Confucius',
        'Not all who wander are lost. - J.R.R. Tolkien',
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      console.log('[CreateTripModal] handleSubmit trip before onSubmit:', tripPayload);
      if (tripPayload && tripPayload.members) {
        console.log('[CreateTripModal] tripPayload.members before onSubmit:', tripPayload.members);
      } else {
        console.log(
          '[CreateTripModal] tripPayload.members is',
          tripPayload ? tripPayload.members : 'tripPayload is undefined'
        );
      }
      const createdTrip = await onSubmit(tripPayload as Trip);
      console.log('[CreateTripModal] createdTrip from backend:', createdTrip);
      if (createdTrip && createdTrip.members) {
        console.log('[CreateTripModal] createdTrip.members:', createdTrip.members);
      } else {
        console.log(
          '[CreateTripModal] createdTrip.members is',
          createdTrip ? createdTrip.members : 'createdTrip is undefined'
        );
      }
      Alert.alert(
        'Trip Created!',
        `Your trip to ${createdTrip.destination?.address} is ready!\n\n${randomQuote}`
      );
      onClose();
    } catch (error) {
      let errorMessage = 'Failed to create trip. Please try again.';
      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
        console.log('[CreateTripModal] Caught error:', error.message, error.stack);
      } else {
        errorMessage += ` (${JSON.stringify(error)})`;
        console.log('[CreateTripModal] Caught error (non-Error object):', error);
      }
      Alert.alert('Error', errorMessage);
      console.log('trip payload', tripPayload);
    } finally {
      setLoading(false);
    }
  }

  function handlePlaceSelected(details: PlaceDetailsWithFullText) {
    if (!details || !details.placeId) {
      Alert.alert('Error', 'Please select a valid destination');
      return;
    }
    setTrip((prev) => ({
      ...prev,
      destination: {
        address: details.formattedAddress || details.name,
        placeId: details.placeId,
        coordinates: details.coordinate
          ? {
              lat: details.coordinate.latitude,
              lng: details.coordinate.longitude,
            }
          : undefined,
      },
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
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close modal background"
        />
        <SafeAreaView
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.background.default, height: windowHeight * 0.7 },
          ]}
        >
          <AutocompleteDropdownContextProvider>
            {/* Drag handle */}
            <View style={styles.dragHandleWrapper}>
              <View style={[styles.dragHandle, { backgroundColor: theme.colors.border.default }]} />
            </View>
            {/* Header */}
            <View style={styles.headerRow}>
              <ThemedText variant="heading.h2" color="content.primary" style={{ flex: 1 }}>
                New Trip
              </ThemedText>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.content.secondary}
                />
              </Pressable>
            </View>
            {/* Form Container with ScrollView */}
            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={styles.formContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Trip name field */}
              <ThemedText variant="body.small" color="content.secondary" style={styles.label}>
                Trip Name
              </ThemedText>
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
              <ThemedText variant="body.small" color="content.secondary" style={styles.label}>
                Destination
              </ThemedText>
              <CustomPlacesAutocomplete
                placeholder="Search Destination"
                onPlaceSelected={handlePlaceSelected}
                initialValue={trip.destination?.address || ''}
              />
              {/* Description field */}
              <ThemedText variant="body.small" color="content.secondary" style={styles.label}>
                Description
              </ThemedText>
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
                  <ThemedText variant="body.small" color="content.secondary" style={styles.label}>
                    Start Date
                  </ThemedText>
                  <Pressable
                    onPress={() => openDatePicker('start')}
                    style={[
                      styles.dateDisplay,
                      {
                        borderColor: theme.colors.outlined.border ?? theme.colors.border.default,
                        backgroundColor: theme.colors.surface.default,
                      },
                    ]}
                    accessibilityLabel="Select start date"
                  >
                    <View style={styles.dateDisplayContent}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={20}
                        color={theme.colors.primary.main}
                        style={{ marginRight: 6 }}
                      />
                      <ThemedText color="content.primary">{formattedStartDate}</ThemedText>
                    </View>
                  </Pressable>
                </View>
                <View style={styles.dateField}>
                  <ThemedText variant="body.small" color="content.secondary" style={styles.label}>
                    End Date
                  </ThemedText>
                  <Pressable
                    onPress={() => openDatePicker('end')}
                    style={[
                      styles.dateDisplay,
                      {
                        borderColor: theme.colors.outlined.border ?? theme.colors.border.default,
                        backgroundColor: theme.colors.surface.default,
                      },
                    ]}
                    accessibilityLabel="Select end date"
                  >
                    <View style={styles.dateDisplayContent}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={20}
                        color={theme.colors.primary.main}
                        style={{ marginRight: 6 }}
                      />
                      <ThemedText color="content.primary">{formattedEndDate}</ThemedText>
                    </View>
                  </Pressable>
                </View>
              </View>
              {/* Date picker — iOS: spinner in inline overlay, Android: native dialog */}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={
                    showDatePicker === 'start' ? new Date(trip.startDate!) : new Date(trip.endDate!)
                  }
                  mode="date"
                  display="default"
                  minimumDate={
                    showDatePicker === 'end' && trip.startDate
                      ? new Date(trip.startDate)
                      : new Date()
                  }
                  onChange={handleDateChange}
                />
              )}
              {showDatePicker && Platform.OS === 'ios' && (
                <View
                  style={[
                    styles.iosPickerContainer,
                    { backgroundColor: theme.colors.surface.default },
                  ]}
                >
                  <View style={styles.iosPickerHeader}>
                    <Pressable onPress={() => setShowDatePicker(null)}>
                      <ThemedText color="content.secondary">Cancel</ThemedText>
                    </Pressable>
                    <ThemedText
                      variant="body.small"
                      color="content.primary"
                      style={{ fontWeight: '600' }}
                    >
                      {showDatePicker === 'start' ? 'Start Date' : 'End Date'}
                    </ThemedText>
                    <Pressable onPress={handleIOSDateDone}>
                      <ThemedText color="primary.main" style={{ fontWeight: '600' }}>
                        Done
                      </ThemedText>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    minimumDate={
                      showDatePicker === 'end' && trip.startDate
                        ? new Date(trip.startDate)
                        : new Date()
                    }
                    onChange={handleDateChange}
                    style={{ height: 150 }}
                  />
                </View>
              )}
            </ScrollView>
            {/* Submit button */}
            <View style={[styles.buttonContainer, { borderTopColor: theme.colors.border.default }]}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={[styles.submitButton, { backgroundColor: theme.colors.primary.main }]}
                labelStyle={[styles.submitButtonLabel, { color: theme.colors.onPrimary }]}
                accessibilityLabel="Create Trip"
                contentStyle={{ height: 48 }}
              >
                Create Trip
              </Button>
            </View>
          </AutocompleteDropdownContextProvider>
        </SafeAreaView>
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
    elevation: 0,
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
  },
  formContentContainer: {
    paddingBottom: 16,
  },
  label: {
    marginBottom: 4,
    marginLeft: 2,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    minHeight: 50,
  },
  dateDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosPickerContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonContainer: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
