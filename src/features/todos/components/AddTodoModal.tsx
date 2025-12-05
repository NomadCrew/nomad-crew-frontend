import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, TextInput, Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useCreateTodo } from '../hooks';

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const AddTodoModal = ({ visible, onClose, tripId }: AddTodoModalProps) => {
  const [text, setText] = useState('');
  const createTodo = useCreateTodo();
  const theme = useAppTheme().theme;

  const handleSubmit = async () => {
    if (!text.trim()) return;

    createTodo.mutate(
      {
        tripId,
        text: text.trim(),
      },
      {
        onSuccess: () => {
          setText('');
          onClose();
        },
      }
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <TextInput
            label="To Do"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            Add
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
