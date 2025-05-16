import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, TextInput, Button, useTheme } from 'react-native-paper';
import { useTodoStore } from '@/src/store/useTodoStore';

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const AddTodoModal = ({ visible, onClose, tripId }: AddTodoModalProps) => {
  const [text, setText] = useState('');
  const { createTodo } = useTodoStore();
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    await createTodo({
      tripId,
      text: text.trim()
    });
    
    setText('');
    onClose();
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
            label="To Do"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
          >
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