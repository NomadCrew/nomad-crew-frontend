import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Portal, Modal, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import Constants from 'expo-constants';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { api } from '@/src/api/api-client';
import { API_PATHS } from '@/src/utils/api-paths';
import { useAuthStore } from '@/src/features/auth/store';
import { ThemedText } from '@/src/components/ThemedText';
import { logger } from '@/src/utils/logger';

const FEEDBACK_SOURCES = {
  bug: 'app_bug',
  feedback: 'app_feedback',
} as const;

type FeedbackType = keyof typeof FEEDBACK_SOURCES;

// Reserve space for the metadata suffix appended to the message
const METADATA_RESERVE = 50;
const MAX_MESSAGE_LENGTH = 5000 - METADATA_RESERVE;

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackModal = React.memo(function FeedbackModal({
  visible,
  onClose,
}: FeedbackModalProps) {
  const theme = useAppTheme().theme;
  const user = useAuthStore((s) => s.user);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '0.0.0';
  const isValid = message.trim().length >= 10;

  const userName = useMemo(() => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName ?? ''}`.trim();
    }
    return user?.username ?? 'App User';
  }, [user?.firstName, user?.lastName, user?.username]);

  const userEmail = user?.email ?? 'anonymous@nomadcrew.uk';

  const themedStyles = useMemo(() => createStyles(theme), [theme]);

  const resetForm = useCallback(() => {
    setFeedbackType('bug');
    setMessage('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSending) return;

    const trimmedMessage = message.trim();
    const fullMessage = `${trimmedMessage}\n\n---\nApp v${appVersion} | ${Platform.OS}`;

    setIsSending(true);
    try {
      await api.post(API_PATHS.feedback.submit, {
        name: userName,
        email: userEmail,
        message: fullMessage,
        source: FEEDBACK_SOURCES[feedbackType],
      });

      resetForm();
      onClose();
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
    } catch (error: unknown) {
      logger.error('Feedback', 'Failed to submit feedback', error);

      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        Alert.alert('Slow down', 'Please wait a moment before submitting again.');
      } else {
        Alert.alert('Error', 'Could not send feedback. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  }, [
    isValid,
    isSending,
    message,
    appVersion,
    userName,
    userEmail,
    feedbackType,
    resetForm,
    onClose,
  ]);

  const handleDismiss = useCallback(() => {
    if (!isSending) {
      onClose();
    }
  }, [isSending, onClose]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={themedStyles.modalContainer}
      >
        <View style={[themedStyles.content, { backgroundColor: theme.colors.surface.default }]}>
          <ThemedText variant="heading.h3" style={themedStyles.title}>
            Send Feedback
          </ThemedText>

          <ThemedText variant="body.small" color="content.tertiary" style={themedStyles.userInfo}>
            Sending as {userName} ({userEmail})
          </ThemedText>

          <SegmentedButtons
            value={feedbackType}
            onValueChange={(v) => setFeedbackType(v as FeedbackType)}
            buttons={[
              { value: 'bug', label: 'Bug Report', icon: 'bug' },
              { value: 'feedback', label: 'Feedback', icon: 'message-text-outline' },
            ]}
            style={themedStyles.segmented}
          />

          <TextInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={5}
            placeholder={
              feedbackType === 'bug'
                ? 'Describe what happened and what you expected...'
                : 'Tell us what you think...'
            }
            maxLength={MAX_MESSAGE_LENGTH}
            style={themedStyles.messageInput}
          />

          <ThemedText variant="body.small" color="content.tertiary" style={themedStyles.charCount}>
            {message.trim().length}/{MAX_MESSAGE_LENGTH} (min 10)
          </ThemedText>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSending}
            disabled={!isValid || isSending}
            style={themedStyles.submitButton}
          >
            Submit
          </Button>
        </View>
      </Modal>
    </Portal>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalContainer: {
      margin: theme.spacing.inset.lg,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    content: {
      padding: theme.spacing.inset.lg,
    },
    title: {
      marginBottom: theme.spacing.stack.sm,
    },
    userInfo: {
      marginBottom: theme.spacing.stack.md,
    },
    segmented: {
      marginBottom: theme.spacing.stack.md,
    },
    messageInput: {
      marginBottom: theme.spacing.stack.xs,
      minHeight: 120,
    },
    charCount: {
      textAlign: 'right' as const,
      marginBottom: theme.spacing.stack.md,
    },
    submitButton: {
      marginTop: theme.spacing.stack.sm,
    },
  });
