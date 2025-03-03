import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...'
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSendMessage = () => {
    if (message.trim() === '' || disabled) return;
    
    onSend(message.trim());
    setMessage('');
    
    // Focus the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles(theme).container}>
        <View style={styles(theme).inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles(theme).input}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.content.tertiary}
            multiline
            maxLength={1000}
            editable={!disabled}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[
              styles(theme).sendButton,
              (!message.trim() || disabled) && styles(theme).disabledSendButton
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || disabled}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                !message.trim() || disabled
                  ? theme.colors.content.tertiary
                  : '#FFFFFF'
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.default,
    paddingVertical: theme.spacing.stack.xs,
    paddingHorizontal: theme.spacing.layout.section.padding,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.stack.sm,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.stack.xs : 0,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.stack.xs : theme.spacing.stack.xxs,
    paddingRight: 40,
    fontSize: theme.typography.size.md,
    color: theme.colors.content.primary,
  },
  sendButton: {
    position: 'absolute',
    right: theme.spacing.stack.xs,
    bottom: theme.spacing.stack.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: theme.colors.background.surface,
  },
}); 