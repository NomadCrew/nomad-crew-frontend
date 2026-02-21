import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, TextInput, Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
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
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles(theme).modalContainer}
      >
        <View style={[styles(theme).content, { backgroundColor: theme.colors.surface.default }]}>
          <TextInput
            label="To Do"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={styles(theme).input}
          />
          <Button mode="contained" onPress={handleSubmit} style={styles(theme).button}>
            Add
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    modalContainer: {
      margin: theme.spacing.inset.lg,
      maxWidth: 640,
      alignSelf: 'center' as const,
      width: '100%',
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    content: {
      padding: theme.spacing.inset.lg,
    },
    input: {
      marginBottom: theme.spacing.stack.md,
    },
    button: {
      marginTop: theme.spacing.stack.sm,
    },
  });
