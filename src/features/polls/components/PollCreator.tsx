import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Switch, Button } from 'react-native-paper';
import { Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';
import { AppBottomSheet } from '@/src/components/molecules/AppBottomSheet/AppBottomSheet';
import { useCreatePoll } from '../hooks';

interface OptionItem {
  id: string;
  text: string;
}

interface PollCreatorProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
}

const DURATION_PRESETS = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '12h', minutes: 720 },
  { label: '24h', minutes: 1440 },
  { label: '48h', minutes: 2880 },
] as const;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 20;
const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;

let nextOptionId = 0;
function createOptionItem(text: string = ''): OptionItem {
  return { id: `opt_${++nextOptionId}`, text };
}

export const PollCreator: React.FC<PollCreatorProps> = ({ tripId, visible, onClose }) => {
  const { theme } = useAppTheme();
  const styles = makeStyles(theme);
  const createPoll = useCreatePoll();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<OptionItem[]>(() => [
    createOptionItem(),
    createOptionItem(),
  ]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(1440);

  const canAddOption = options.length < MAX_OPTIONS;
  const filledOptions = options.filter((o) => o.text.trim().length > 0);
  const canSubmit =
    question.trim().length > 0 && filledOptions.length >= MIN_OPTIONS && !createPoll.isPending;

  const handleAddOption = useCallback(() => {
    if (!canAddOption) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptions((prev) => [...prev, createOptionItem()]);
  }, [canAddOption]);

  const handleRemoveOption = useCallback(
    (id: string) => {
      if (options.length <= MIN_OPTIONS) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setOptions((prev) => prev.filter((opt) => opt.id !== id));
    },
    [options.length]
  );

  const handleOptionChange = useCallback((id: string, text: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    createPoll.mutate(
      {
        tripId,
        input: {
          question: question.trim(),
          options: filledOptions.map((o) => o.text.trim()),
          allowMultipleVotes,
          durationMinutes,
        },
      },
      {
        onSuccess: () => {
          setQuestion('');
          setOptions([createOptionItem(), createOptionItem()]);
          setAllowMultipleVotes(false);
          setDurationMinutes(1440);
          onClose();
        },
      }
    );
  }, [
    canSubmit,
    tripId,
    question,
    filledOptions,
    allowMultipleVotes,
    durationMinutes,
    createPoll,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    setQuestion('');
    setOptions([createOptionItem(), createOptionItem()]);
    setAllowMultipleVotes(false);
    setDurationMinutes(1440);
    onClose();
  }, [onClose]);

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      title="Settle this already"
      snapPoints={['70%', '90%']}
      scrollable
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Question Input */}
        <View style={styles.section}>
          <Text style={styles.label}>What's the debate?</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Where should we eat tonight?"
            maxLength={MAX_QUESTION_LENGTH}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.questionInput}
          />
          <Text style={styles.charCount}>
            {question.length}/{MAX_QUESTION_LENGTH}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.label}>Options</Text>
          {options.map((option, index) => (
            <View key={option.id} style={styles.optionRow}>
              <TextInput
                value={option.text}
                onChangeText={(text) => handleOptionChange(option.id, text)}
                placeholder={`Option ${index + 1}`}
                maxLength={MAX_OPTION_LENGTH}
                mode="outlined"
                style={styles.optionInput}
              />
              {options.length > MIN_OPTIONS && (
                <Pressable
                  onPress={() => handleRemoveOption(option.id)}
                  hitSlop={8}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove option ${index + 1}`}
                >
                  <Trash2 size={18} color={theme.colors.content.tertiary} />
                </Pressable>
              )}
            </View>
          ))}

          {canAddOption && (
            <Pressable
              onPress={handleAddOption}
              style={styles.addOptionButton}
              accessibilityRole="button"
              accessibilityLabel="Add option"
            >
              <Plus size={18} color={theme.colors.primary.main} />
              <Text style={styles.addOptionText}>Add option</Text>
            </Pressable>
          )}
        </View>

        {/* Multi-vote toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleLabel}>Allow multiple votes</Text>
            <Text style={styles.toggleDescription}>Nomads can pick more than one</Text>
          </View>
          <Switch
            value={allowMultipleVotes}
            onValueChange={setAllowMultipleVotes}
            color={theme.colors.primary.main}
          />
        </View>

        {/* Duration picker */}
        <View style={styles.durationSection}>
          <Text style={styles.durationLabel}>Time to decide</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.durationRow}>
              {DURATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset.minutes}
                  onPress={() => setDurationMinutes(preset.minutes)}
                  style={[
                    styles.durationChip,
                    durationMinutes === preset.minutes && styles.durationChipSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Set duration to ${preset.label}`}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      durationMinutes === preset.minutes && styles.durationChipTextSelected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={createPoll.isPending}
          style={styles.submitButton}
          labelStyle={styles.submitLabel}
        >
          {createPoll.isPending ? 'Creating...' : 'Your call, nomad'}
        </Button>
      </KeyboardAvoidingView>
    </AppBottomSheet>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingBottom: 24,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      ...theme.typography.body.medium,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginBottom: 8,
    },
    questionInput: {
      backgroundColor: theme.colors.surface.default,
    },
    charCount: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
      textAlign: 'right',
      marginTop: 4,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    optionInput: {
      flex: 1,
      backgroundColor: theme.colors.surface.default,
    },
    removeButton: {
      padding: 8,
      borderRadius: 8,
    },
    addOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    addOptionText: {
      ...theme.typography.body.small,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    toggleTextContainer: {
      flex: 1,
      marginRight: 12,
    },
    toggleLabel: {
      ...theme.typography.body.medium,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },
    toggleDescription: {
      ...theme.typography.caption,
      color: theme.colors.content.tertiary,
      marginTop: 2,
    },
    durationSection: {
      marginTop: 12,
      marginBottom: 20,
    },
    durationLabel: {
      ...theme.typography.body.small,
      fontWeight: '600',
      color: theme.colors.content.secondary,
      marginBottom: 8,
    },
    durationRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    durationChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.surface.variant,
    },
    durationChipSelected: {
      backgroundColor: theme.colors.primary.main,
    },
    durationChipText: {
      ...theme.typography.body.small,
      fontWeight: '500',
      color: theme.colors.content.secondary,
    },
    durationChipTextSelected: {
      color: theme.colors.primary.onPrimary,
      fontWeight: '700',
    },
    submitButton: {
      borderRadius: 12,
      paddingVertical: 4,
    },
    submitLabel: {
      ...theme.typography.button.medium,
      fontSize: 15,
      letterSpacing: 0.3,
    },
  });
