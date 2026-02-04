import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Button, RadioButton } from 'react-native-paper';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useTripStore } from '@/src/features/trips/store';
import { useAuthStore } from '@/src/features/auth/store';
import { X } from 'lucide-react-native';
import { UserAutocomplete } from '@/src/features/users';
import { UserSearchResult } from '@/src/api/api-client';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const InviteModal = ({ visible, onClose, tripId }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const theme = useAppTheme().theme;
  const { user } = useAuthStore();
  const { trips, inviteMember } = useTripStore();

  // Get the current trip
  const trip = trips.find((t) => t.id === tripId);

  // Check if current user is owner or admin
  const members = trip?.members || [];
  const currentUserRole = members.find((member) => member.userId === user?.id)?.role || 'member';
  const isOwner = currentUserRole === 'owner';

  // Handle user selection from autocomplete
  const handleUserSelected = useCallback((user: UserSearchResult) => {
    setSelectedUser(user);
    setEmail(user.contactEmail || user.email);
  }, []);

  // Handle manual email entry
  const handleManualEmail = useCallback((manualEmail: string) => {
    setSelectedUser(null);
    setEmail(manualEmail);
  }, []);

  const handleSubmit = async () => {
    if (!email.trim()) return;

    try {
      setLoading(true);
      await inviteMember(tripId, email.trim(), role);
      setEmail('');
      setSelectedUser(null);
      onClose();
    } catch (error) {
      Alert.alert(
        'Invitation Failed',
        error instanceof Error ? error.message : 'Could not send invitation'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setEmail('');
    setSelectedUser(null);
    setRole('member');
    onClose();
  }, [onClose]);

  const themedStyles = styles(theme);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleClose}>
      <AutocompleteDropdownContextProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={themedStyles.modalOverlay}
        >
          <View
            style={[
              themedStyles.modalContent,
              { backgroundColor: theme.colors.background.default },
            ]}
          >
            {/* Header */}
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Invite Member</Text>
              <Pressable onPress={handleClose} style={themedStyles.closeButton}>
                <X size={24} color={theme.colors.content.primary} />
              </Pressable>
            </View>

            {/* User Search Autocomplete */}
            <Text style={themedStyles.inputLabel}>Search user or enter email</Text>
            <UserAutocomplete
              tripId={tripId}
              onUserSelected={handleUserSelected}
              onManualEmail={handleManualEmail}
              placeholder="Search by name, username, or email..."
              disabled={loading}
            />

            {/* Show selected user or email */}
            {email && (
              <View style={themedStyles.selectedContainer}>
                <Text style={themedStyles.selectedLabel}>
                  {selectedUser
                    ? `Inviting: ${selectedUser.firstName || selectedUser.username} (${email})`
                    : `Inviting: ${email}`}
                </Text>
              </View>
            )}

            {/* Role Selection */}
            <Text style={themedStyles.roleLabel}>Role</Text>
            <RadioButton.Group
              onValueChange={(value) => setRole(value as 'member' | 'admin')}
              value={role}
            >
              <Pressable style={themedStyles.radioOption} onPress={() => setRole('member')}>
                <RadioButton value="member" />
                <Text style={themedStyles.radioText}>Member</Text>
              </Pressable>

              {isOwner && (
                <Pressable style={themedStyles.radioOption} onPress={() => setRole('admin')}>
                  <RadioButton value="admin" />
                  <Text style={themedStyles.radioText}>Admin</Text>
                </Pressable>
              )}
            </RadioButton.Group>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={themedStyles.button}
              loading={loading}
              disabled={loading || !email.trim()}
            >
              Send Invite
            </Button>
          </View>
        </KeyboardAvoidingView>
      </AutocompleteDropdownContextProvider>
    </Modal>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.inset.lg,
    },
    modalContent: {
      borderRadius: theme.spacing.inset.md,
      padding: theme.spacing.inset.lg,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.md,
    },
    modalTitle: {
      ...theme.typography.heading.h3,
      color: theme.colors.content.primary,
    },
    closeButton: {
      padding: theme.spacing.inset.xs,
    },
    inputLabel: {
      ...theme.typography.body.medium,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.stack.xs,
    },
    selectedContainer: {
      backgroundColor: theme.colors.surface.variant,
      padding: theme.spacing.inset.sm,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.stack.sm,
    },
    selectedLabel: {
      ...theme.typography.body.small,
      color: theme.colors.content.secondary,
    },
    roleLabel: {
      ...theme.typography.body.medium,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginTop: theme.spacing.stack.md,
      marginBottom: theme.spacing.stack.xs,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.inset.xs,
    },
    radioText: {
      ...theme.typography.body.medium,
      color: theme.colors.content.primary,
    },
    button: {
      marginTop: theme.spacing.stack.md,
    },
  });
