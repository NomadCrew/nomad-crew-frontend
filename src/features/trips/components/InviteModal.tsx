import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Portal, Modal, TextInput, Button, RadioButton, Text } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useTripStore } from '@/src/features/trips/store'; // Updated path
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types'; // Updated path

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const InviteModal = ({ visible, onClose, tripId }: InviteModalProps) => {
  const [email, setEmail] = useState('');
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

  const handleSubmit = async () => {
    if (!email.trim()) return;

    try {
      setLoading(true);
      await inviteMember(tripId, email.trim(), role);
      setEmail('');
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

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { overflow: 'hidden' }]}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background.default }]}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.roleLabel}>Role</Text>
          <RadioButton.Group
            onValueChange={(value) => setRole(value as 'member' | 'admin')}
            value={role}
          >
            <View style={styles.radioOption}>
              <RadioButton value="member" />
              <Text>Member</Text>
            </View>

            {isOwner && (
              <View style={styles.radioOption}>
                <RadioButton value="admin" />
                <Text>Admin</Text>
              </View>
            )}
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Send Invite
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
  },
  roleLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
