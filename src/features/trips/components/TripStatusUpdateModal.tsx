import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Trip, TripStatus } from '@/src/features/trips/types';
import { useUpdateTripStatus } from '@/src/features/trips/hooks';
import { TripStatusBadge } from './TripStatusBadge';
import { AppBottomSheet } from '@/src/components/molecules/AppBottomSheet';
import { Check } from 'lucide-react-native';

// Note: Using inline styles(theme) function pattern instead of useThemedStyles hook

interface TripStatusUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

export const TripStatusUpdateModal: React.FC<TripStatusUpdateModalProps> = ({
  visible,
  onClose,
  trip,
}) => {
  const theme = useAppTheme().theme;
  const updateTripStatusMutation = useUpdateTripStatus();
  const [error, setError] = useState<string | null>(null);

  const statusOptions: TripStatus[] = ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

  // Check if a status transition is valid based on backend rules
  const isValidTransition = (currentStatus: TripStatus, newStatus: TripStatus): boolean => {
    // Current date for time-based constraints
    const now = new Date();
    const tripEndDate = new Date(trip.endDate);

    // Status transition rules
    switch (currentStatus) {
      case 'PLANNING':
        // From PLANNING: Can transition to ACTIVE or CANCELLED
        if (newStatus === 'ACTIVE') {
          // Cannot transition to ACTIVE if the trip's end date is in the past
          return tripEndDate > now;
        }
        return newStatus === 'CANCELLED';

      case 'ACTIVE':
        // From ACTIVE: Can transition to COMPLETED or CANCELLED
        if (newStatus === 'COMPLETED') {
          // Cannot transition to COMPLETED if the trip's end date is in the future
          return tripEndDate <= now;
        }
        return newStatus === 'CANCELLED';

      case 'COMPLETED':
      case 'CANCELLED':
        // From COMPLETED or CANCELLED: No transitions allowed (terminal state)
        return false;

      default:
        return false;
    }
  };

  // Get a message explaining why a transition is invalid
  const getTransitionMessage = (currentStatus: TripStatus, newStatus: TripStatus): string => {
    const now = new Date();
    const tripEndDate = new Date(trip.endDate);

    switch (currentStatus) {
      case 'PLANNING':
        if (newStatus === 'ACTIVE' && tripEndDate <= now) {
          return 'Cannot activate a trip that has already ended';
        }
        if (newStatus === 'COMPLETED') {
          return 'Must activate a trip before completing it';
        }
        break;

      case 'ACTIVE':
        if (newStatus === 'COMPLETED' && tripEndDate > now) {
          return 'Cannot complete a trip before its end date';
        }
        if (newStatus === 'PLANNING') {
          return 'Cannot revert to planning once a trip is active';
        }
        break;

      case 'COMPLETED':
        return 'Cannot change status of a completed trip';

      case 'CANCELLED':
        return 'Cannot change status of a cancelled trip';
    }

    return '';
  };

  const handleStatusUpdate = async (status: TripStatus) => {
    if (status === trip.status) {
      onClose();
      return;
    }

    if (!isValidTransition(trip.status, status)) {
      setError(getTransitionMessage(trip.status, status));
      return;
    }

    setError(null);

    try {
      await updateTripStatusMutation.mutateAsync({ id: trip.id, status });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip status');
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Update Status"
      snapPoints={['55%']}
      scrollable={true}
    >
      <View style={styles(theme).currentStatusRow}>
        <Text style={styles(theme).currentStatusLabel}>Current status</Text>
        <TripStatusBadge status={trip.status} size="small" />
      </View>

      <View style={styles(theme).statusOptionsContainer}>
        {statusOptions.map((status) => {
          const isCurrent = status === trip.status;
          const isValid = isCurrent || isValidTransition(trip.status, status);
          const isDisabled = !isValid || updateTripStatusMutation.isPending;

          return (
            <Pressable
              key={status}
              style={[
                styles(theme).statusOption,
                isDisabled && !isCurrent && styles(theme).disabledStatusOption,
              ]}
              onPress={() => handleStatusUpdate(status)}
              disabled={isDisabled}
            >
              <TripStatusBadge status={status} size="medium" />
              <View style={styles(theme).statusTextContainer}>
                <Text
                  style={[
                    styles(theme).statusDescription,
                    isDisabled && !isCurrent && styles(theme).disabledText,
                  ]}
                >
                  {getStatusDescription(status)}
                </Text>
                {!isValid && !isCurrent && (
                  <Text style={styles(theme).notAvailableText}>Not available</Text>
                )}
              </View>
              {isCurrent && (
                <Check size={20} color={theme.colors.status.success.content} strokeWidth={2.5} />
              )}
            </Pressable>
          );
        })}
      </View>

      {updateTripStatusMutation.isPending && (
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary.main} />
          <Text style={styles(theme).loadingText}>Updating status...</Text>
        </View>
      )}

      {error && <Text style={styles(theme).errorText}>{error}</Text>}
    </AppBottomSheet>
  );
};

const getStatusDescription = (status: TripStatus): string => {
  switch (status) {
    case 'PLANNING':
      return 'Trip is being planned';
    case 'ACTIVE':
      return 'Trip is currently active';
    case 'COMPLETED':
      return 'Trip has been completed';
    case 'CANCELLED':
      return 'Trip has been cancelled';
    default:
      return '';
  }
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    currentStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.stack.lg,
      paddingVertical: theme.spacing.inset.sm,
      paddingHorizontal: theme.spacing.inset.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.borderRadius?.md ?? theme.shape?.borderRadius.medium ?? 8,
      backgroundColor: theme.colors.surface.variant,
    },
    currentStatusLabel: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
    },
    statusOptionsContainer: {
      gap: theme.spacing.stack.sm,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.inset.md,
      paddingHorizontal: theme.spacing.inset.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.borderRadius?.md ?? theme.shape?.borderRadius.medium ?? 8,
      backgroundColor: theme.colors.surface.default,
    },
    disabledStatusOption: {
      opacity: 0.5,
    },
    statusTextContainer: {
      marginLeft: theme.spacing.stack.sm,
      flex: 1,
    },
    statusDescription: {
      ...theme.typography.body.medium,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },
    disabledText: {
      color: theme.colors.content.disabled,
    },
    notAvailableText: {
      ...theme.typography.body.small,
      color: theme.colors.content.disabled,
      marginTop: theme.spacing.stack.xxs,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.stack.md,
    },
    loadingText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.secondary,
      marginLeft: theme.spacing.stack.xs,
    },
    errorText: {
      ...theme.typography.body.medium,
      color: theme.colors.status.error.main,
      textAlign: 'center',
      marginTop: theme.spacing.stack.md,
    },
  });
