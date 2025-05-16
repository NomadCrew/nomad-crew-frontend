import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Trip, TripStatus } from '@/src/types/trip';
import { useTripStore } from '@/src/store/useTripStore';
import { TripStatusBadge } from './TripStatusBadge';
import { X, AlertCircle } from 'lucide-react-native';

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
  const { theme } = useTheme();
  const { updateTripStatus } = useTripStore();
  const [loading, setLoading] = useState(false);
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
          return "Cannot activate a trip that has already ended";
        }
        if (newStatus === 'COMPLETED') {
          return "Must activate a trip before completing it";
        }
        break;
        
      case 'ACTIVE':
        if (newStatus === 'COMPLETED' && tripEndDate > now) {
          return "Cannot complete a trip before its end date";
        }
        if (newStatus === 'PLANNING') {
          return "Cannot revert to planning once a trip is active";
        }
        break;
        
      case 'COMPLETED':
        return "Cannot change status of a completed trip";
        
      case 'CANCELLED':
        return "Cannot change status of a cancelled trip";
    }
    
    return "";
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

    setLoading(true);
    setError(null);
    
    try {
      await updateTripStatus(trip.id, status);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles(theme).modalOverlay}>
        <View style={styles(theme).modalContent}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Update Trip Status</Text>
            <Pressable 
              onPress={onClose}
              style={styles(theme).closeButton}
            >
              <X size={24} color={theme.colors.content.primary} />
            </Pressable>
          </View>

          <Text style={styles(theme).modalSubtitle}>
            Current status: <TripStatusBadge status={trip.status} />
          </Text>
          
          <View style={styles(theme).rulesContainer}>
            <AlertCircle size={16} color={theme.colors.content.secondary} />
            <Text style={styles(theme).rulesText}>
              Status can only be changed according to these rules:
              {'\n'}• From Planning: Can move to Active or Cancelled
              {'\n'}• From Active: Can move to Completed or Cancelled
              {'\n'}• Completed and Cancelled are final states
            </Text>
          </View>

          <View style={styles(theme).statusOptionsContainer}>
            {statusOptions.map((status) => {
              const isValid = status === trip.status || isValidTransition(trip.status, status);
              const message = !isValid ? getTransitionMessage(trip.status, status) : "";
              
              return (
                <Pressable
                  key={status}
                  style={[
                    styles(theme).statusOption,
                    trip.status === status && styles(theme).selectedStatusOption,
                    !isValid && styles(theme).disabledStatusOption
                  ]}
                  onPress={() => handleStatusUpdate(status)}
                  disabled={loading || !isValid}
                >
                  <TripStatusBadge status={status} size="large" />
                  <View style={styles(theme).statusTextContainer}>
                    <Text style={[
                      styles(theme).statusDescription,
                      !isValid && styles(theme).disabledText
                    ]}>
                      {getStatusDescription(status)}
                    </Text>
                    {!isValid && message ? (
                      <Text style={styles(theme).invalidReasonText}>{message}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {loading && (
            <View style={styles(theme).loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary.main} />
              <Text style={styles(theme).loadingText}>Updating status...</Text>
            </View>
          )}

          {error && (
            <Text style={styles(theme).errorText}>{error}</Text>
          )}
        </View>
      </View>
    </Modal>
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

const styles = (theme: Theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.inset.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.spacing.inset.md,
    padding: theme.spacing.inset.lg,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.stack.md,
  },
  modalTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.content.primary,
  },
  modalSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.content.secondary,
    marginBottom: theme.spacing.stack.md,
  },
  closeButton: {
    padding: theme.spacing.inset.xs,
  },
  rulesContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.variant,
    padding: theme.spacing.inset.md,
    borderRadius: theme.spacing.inset.sm,
    marginBottom: theme.spacing.stack.lg,
    gap: theme.spacing.stack.sm,
    alignItems: 'flex-start',
  },
  rulesText: {
    ...theme.typography.body.small,
    color: theme.colors.content.secondary,
    flex: 1,
  },
  statusOptionsContainer: {
    gap: theme.spacing.stack.md,
  },
  statusOption: {
    padding: theme.spacing.inset.md,
    borderRadius: theme.spacing.inset.sm,
    backgroundColor: theme.colors.surface.variant,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.stack.md,
  },
  selectedStatusOption: {
    backgroundColor: theme.colors.primary.hover,
  },
  disabledStatusOption: {
    opacity: 0.6,
    backgroundColor: theme.colors.surface.variant,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusDescription: {
    ...theme.typography.body.medium,
    color: theme.colors.content.primary,
  },
  disabledText: {
    color: theme.colors.content.disabled,
  },
  invalidReasonText: {
    ...theme.typography.caption,
    color: theme.colors.status.error.content,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.stack.md,
    gap: theme.spacing.stack.sm,
  },
  loadingText: {
    ...theme.typography.body.small,
    color: theme.colors.content.secondary,
  },
  errorText: {
    ...theme.typography.body.small,
    color: theme.colors.status.error.content,
    marginTop: theme.spacing.stack.md,
  },
}); 