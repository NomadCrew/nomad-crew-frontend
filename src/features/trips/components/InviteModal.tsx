import React, { useState, useCallback, useEffect } from 'react';
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
import { Button, RadioButton, HelperText } from 'react-native-paper';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { useTripStore } from '@/src/features/trips/store';
import { useAuthStore } from '@/src/features/auth/store';
import { X, CheckCircle } from 'lucide-react-native';
import { UserAutocomplete } from '@/src/features/users';
import { UserSearchResult } from '@/src/api/api-client';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteModal = ({ visible, onClose, tripId }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useAppTheme().theme;
  const { user } = useAuthStore();
  const { trips, inviteMember } = useTripStore();

  const trip = trips.find((t) => t.id === tripId);

  const members = trip?.members || [];
  const currentUserRole = members.find((member) => member.userId === user?.id)?.role || 'member';
  const isOwner = currentUserRole === 'owner';

  const emailError =
    emailTouched && email.trim() !== '' && !selectedUser && !EMAIL_REGEX.test(email.trim())
      ? 'Please enter a valid email address'
      : '';

  const handleUserSelected = useCallback((user: UserSearchResult) => {
    setSelectedUser(user);
    setEmail(user.contactEmail || user.email);
    setEmailTouched(false);
  }, []);

  const handleManualEmail = useCallback((manualEmail: string) => {
    setSelectedUser(null);
    setEmail(manualEmail);
    if (manualEmail.length > 0) {
      setEmailTouched(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (!email.trim()) return;

    if (!selectedUser && !EMAIL_REGEX.test(email.trim())) {
      setEmailTouched(true);
      return;
    }

    try {
      setLoading(true);
      await inviteMember(tripId, email.trim(), role);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEmail('');
        setSelectedUser(null);
        setEmailTouched(false);
        onClose();
      }, 1500);
    } catch (error) {
      Alert.alert(
        'Invitation Failed',
        error instanceof Error ? error.message : 'Could not send invitation'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (loading) return;
    setEmail('');
    setSelectedUser(null);
    setRole('member');
    setEmailTouched(false);
    setShowSuccess(false);
    onClose();
  }, [onClose, loading]);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setShowSuccess(false);
      setEmailTouched(false);
    }
  }, [visible]);

  const themedStyles = styles(theme);
  const isSubmitDisabled = loading || !email.trim() || (!!emailError && !selectedUser);

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
            {showSuccess ? (
              <View style={themedStyles.successContainer}>
                <CheckCircle size={48} color={theme.colors.success?.main || '#4CAF50'} />
                <Text style={[themedStyles.successText, { color: theme.colors.content.primary }]}>
                  Invitation Sent!
                </Text>
                <Text
                  style={[themedStyles.successSubtext, { color: theme.colors.content.secondary }]}
                >
                  {selectedUser
                    ? `${selectedUser.firstName || selectedUser.username} will receive the invite`
                    : `An invitation has been sent to ${email}`}
                </Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={themedStyles.modalHeader}>
                  <Text style={themedStyles.modalTitle}>Invite Member</Text>
                  <Pressable
                    onPress={handleClose}
                    style={themedStyles.closeButton}
                    accessibilityLabel="Close invite modal"
                    accessibilityRole="button"
                    disabled={loading}
                  >
                    <X
                      size={24}
                      color={
                        loading ? theme.colors.content.secondary : theme.colors.content.primary
                      }
                    />
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

                {/* Inline email validation error */}
                {emailError ? (
                  <HelperText type="error" visible={true} style={themedStyles.errorHelper}>
                    {emailError}
                  </HelperText>
                ) : null}

                {/* Show selected user or email */}
                {email && !emailError && (
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
                  onValueChange={(value) => !loading && setRole(value as 'member' | 'admin')}
                  value={role}
                >
                  <Pressable
                    style={[themedStyles.radioOption, loading && themedStyles.disabledOption]}
                    onPress={() => !loading && setRole('member')}
                    accessibilityLabel="Set role to Member"
                    accessibilityRole="radio"
                    accessibilityState={{ checked: role === 'member' }}
                    disabled={loading}
                  >
                    <RadioButton value="member" disabled={loading} />
                    <Text style={[themedStyles.radioText, loading && themedStyles.disabledText]}>
                      Member
                    </Text>
                  </Pressable>

                  {isOwner && (
                    <Pressable
                      style={[themedStyles.radioOption, loading && themedStyles.disabledOption]}
                      onPress={() => !loading && setRole('admin')}
                      accessibilityLabel="Set role to Admin"
                      accessibilityRole="radio"
                      accessibilityState={{ checked: role === 'admin' }}
                      disabled={loading}
                    >
                      <RadioButton value="admin" disabled={loading} />
                      <Text style={[themedStyles.radioText, loading && themedStyles.disabledText]}>
                        Admin
                      </Text>
                    </Pressable>
                  )}
                </RadioButton.Group>

                {/* Submit Button */}
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={themedStyles.button}
                  loading={loading}
                  disabled={isSubmitDisabled}
                  accessibilityLabel="Send invitation"
                  accessibilityRole="button"
                >
                  Send Invite
                </Button>
              </>
            )}
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
    errorHelper: {
      marginTop: 0,
      paddingHorizontal: 0,
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
    disabledOption: {
      opacity: 0.5,
    },
    disabledText: {
      color: theme.colors.content.secondary,
    },
    button: {
      marginTop: theme.spacing.stack.md,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.stack.lg,
    },
    successText: {
      ...theme.typography.heading.h3,
      marginTop: theme.spacing.stack.md,
      textAlign: 'center',
    },
    successSubtext: {
      ...theme.typography.body.medium,
      marginTop: theme.spacing.stack.sm,
      textAlign: 'center',
    },
  });
