import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Portal, Modal, TextInput, Button, useTheme } from 'react-native-paper';
import { useTripStore } from '@/src/store/useTripStore';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const InviteModal = ({ visible, onClose, tripId }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!email.trim()) return;
    
    try {
      setLoading(true);
      await useTripStore.getState().inviteMember(tripId, email.trim());
      setEmail('');
      onClose();
    } catch (error) {
      Alert.alert('Invitation Failed', error instanceof Error ? error.message : 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background }
        ]}
      >
        <View style={styles.content}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
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
}); 