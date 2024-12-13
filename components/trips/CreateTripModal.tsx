import { Modal, ScrollView, Platform, TextInput, KeyboardAvoidingView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/src/theme/ThemeProvider';

export interface Trip {
  name: string;
  description: string;
  destination: string;
  startDate: Date;
  endDate: Date;
}

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (trip: Trip) => Promise<void>;
}

interface FormErrors {
  name?: string;
  destination?: string;
  endDate?: string;
}

const initialTripState: Trip = {
  name: '',
  description: '',
  destination: '',
  startDate: new Date(),
  endDate: new Date(),
};

export default function CreateTripModal({ visible, onClose, onSubmit }: CreateTripModalProps) {
  const [trip, setTrip] = useState<Trip>(initialTripState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const nameShake = useSharedValue(0);
  const destinationShake = useSharedValue(0);
  const endDateShake = useSharedValue(0);

  const { theme } = useTheme();

  useEffect(() => {
    const hasChanges = Object.keys(trip).some((key) => {
      const k = key as keyof Trip;
      if (k === 'startDate' || k === 'endDate') {
        return trip[k].getTime() !== initialTripState[k].getTime();
      }
      return trip[k] !== initialTripState[k];
    });
    setHasUnsavedChanges(hasChanges);
  }, [trip]);

  const resetForm = () => {
    setTrip(initialTripState);
    setErrors({});
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: Platform.OS === 'ios' ? 'Keep Editing' : 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => {
          resetForm();
          onClose();
        }},
      ],
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!trip.name.trim()) {
      newErrors.name = 'Trip name is required';
      nameShake.value = withSequence(withTiming(10), withTiming(-10), withTiming(0));
      isValid = false;
    }

    if (!trip.destination.trim()) {
      newErrors.destination = 'Destination is required';
      destinationShake.value = withSequence(withTiming(10), withTiming(-10), withTiming(0));
      isValid = false;
    }

    if (trip.endDate < trip.startDate) {
      newErrors.endDate = 'End date must be after start date';
      endDateShake.value = withSequence(withTiming(10), withTiming(-10), withTiming(0));
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(trip);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    if (selectedDate && showDatePicker) {
      const dateKey = showDatePicker === 'start' ? 'startDate' : 'endDate';
      setTrip((prev) => ({
        ...prev,
        [dateKey]: selectedDate,
      }));
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nameShake.value }],
  }));

  const destinationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: destinationShake.value }],
  }));

  const endDateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endDateShake.value }],
  }));

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ThemedView
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <ThemedView
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '90%',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 5,
                },
              }),
            }}
          >
            <ThemedView
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                paddingHorizontal: 4,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: theme.colors.onBackground,
                }}
              >
                New Trip
              </ThemedText>
              <Pressable 
                onPress={handleClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <IconSymbol
                  name={Platform.OS === 'ios' ? 'xmark.circle.fill' : 'close'}
                  size={24}
                  color={theme.colors.primary}
                />
              </Pressable>
            </ThemedView>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedView style={{ gap: 16 }}>
                {/* Name Input */}
                <ThemedView style={{ gap: 8 }}>
                  <ThemedText style={{ 
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.onBackground,
                  }}>
                    Trip Name*
                  </ThemedText>
                  <Animated.View style={nameAnimatedStyle}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: errors.name ? theme.colors.error : theme.colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                      }}
                      value={trip.name}
                      onChangeText={(text) => {
                        setTrip(prev => ({ ...prev, name: text }));
                        setErrors(prev => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Enter trip name"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                    />
                  </Animated.View>
                  {errors.name && (
                    <ThemedText style={{
                      color: theme.colors.error,
                      fontSize: 12,
                      marginTop: 4,
                    }}>
                      {errors.name}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Destination Input */}
                <ThemedView style={{ gap: 8 }}>
                  <ThemedText style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.onBackground,
                  }}>
                    Destination*
                  </ThemedText>
                  <Animated.View style={destinationAnimatedStyle}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: errors.destination ? theme.colors.error : theme.colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                      }}
                      value={trip.destination}
                      onChangeText={(text) => {
                        setTrip(prev => ({ ...prev, destination: text }));
                        setErrors(prev => ({ ...prev, destination: undefined }));
                      }}
                      placeholder="Where are you going?"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                    />
                  </Animated.View>
                  {errors.destination && (
                    <ThemedText style={{
                      color: theme.colors.error,
                      fontSize: 12,
                      marginTop: 4,
                    }}>
                      {errors.destination}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Description Input */}
                <ThemedView style={{ gap: 8 }}>
                  <ThemedText style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.onBackground,
                  }}>
                    Description
                  </ThemedText>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.onSurface,
                      height: 100,
                      textAlignVertical: 'top',
                    }}
                    value={trip.description}
                    onChangeText={(text) => setTrip(prev => ({ ...prev, description: text }))}
                    placeholder="Add some details about your trip"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    multiline
                    numberOfLines={4}
                  />
                </ThemedView>

                {/* Date Inputs */}
                <ThemedView style={{ gap: 8 }}>
                  <ThemedText style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.onBackground,
                  }}>
                    Start Date*
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowDatePicker('start')}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <ThemedText>{format(trip.startDate, 'MMM dd, yyyy')}</ThemedText>
                  </Pressable>
                </ThemedView>

                <ThemedView style={{ gap: 8 }}>
                  <ThemedText style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.onBackground,
                  }}>
                    End Date*
                  </ThemedText>
                  <Animated.View style={endDateAnimatedStyle}>
                    <Pressable
                      onPress={() => setShowDatePicker('end')}
                      style={{
                        borderWidth: 1,
                        borderColor: errors.endDate ? theme.colors.error : theme.colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <ThemedText>{format(trip.endDate, 'MMM dd, yyyy')}</ThemedText>
                    </Pressable>
                  </Animated.View>
                  {errors.endDate && (
                    <ThemedText style={{
                      color: theme.colors.error,
                      fontSize: 12,
                      marginTop: 4,
                    }}>
                      {errors.endDate}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Date Picker */}
                {(showDatePicker || Platform.OS === 'ios') && (
                  <DateTimePicker
                    value={showDatePicker === 'start' ? trip.startDate : trip.endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={showDatePicker === 'end' ? trip.startDate : undefined}
                  />
                )}

                {/* Submit Button */}
                <ThemedView style={{ 
                  marginTop: 24,
                  marginBottom: Platform.OS === 'ios' ? 34 : 24,
                }}>
                  <Pressable
                    style={{
                      backgroundColor: theme.colors.primary,
                      padding: 16,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 50,
                      opacity: loading ? 0.7 : 1,
                    }}
                    onPress={handleSubmit}
                    disabled={loading}
                    accessibilityLabel="Create trip"
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                      <ThemedText style={{
                        color: theme.colors.onPrimary,
                        fontSize: 16,
                        fontWeight: '600',
                      }}>
                        Create Trip
                      </ThemedText>
                    )}
                  </Pressable>
                </ThemedView>
              </ThemedView>
            </ScrollView>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}