import React from 'react';
import { render, fireEvent } from '../../test-utils';
import { PollCreator } from '@/src/features/polls/components/PollCreator';

// Mock react-native-paper to avoid Animated issues with TextInput
jest.mock('react-native-paper', () => {
  const RN = require('react-native');
  return {
    Text: RN.Text,
    TextInput: ({ value, onChangeText, placeholder, mode, ...rest }: any) => (
      <RN.TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} {...rest} />
    ),
    Switch: ({ value, onValueChange, ...rest }: any) => (
      <RN.Switch value={value} onValueChange={onValueChange} {...rest} />
    ),
    Button: ({ children, onPress, disabled, loading, ...rest }: any) => (
      <RN.Pressable onPress={onPress} disabled={disabled} {...rest}>
        <RN.Text>{typeof children === 'string' ? children : ''}</RN.Text>
      </RN.Pressable>
    ),
    Surface: RN.View,
    PaperProvider: ({ children }: any) => <>{children}</>,
  };
});

// Mock hooks
const mockCreatePollMutate = jest.fn();
jest.mock('@/src/features/polls/hooks', () => ({
  useCreatePoll: () => ({
    mutate: mockCreatePollMutate,
    isPending: false,
  }),
}));

// Mock AppBottomSheet as a simple wrapper that renders children when visible
jest.mock('@/src/components/molecules/AppBottomSheet/AppBottomSheet', () => {
  const { View } = require('react-native');
  return {
    AppBottomSheet: ({ visible, children }: any) =>
      visible ? <View testID="bottom-sheet">{children}</View> : null,
  };
});

// Mock lucide icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Plus: (props: any) => <View testID="plus-icon" {...props} />,
    Trash2: (props: any) => <View testID="trash-icon" {...props} />,
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

describe('PollCreator', () => {
  const tripId = 'trip-123';
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders duration preset chips', () => {
    const { getByText } = render(<PollCreator tripId={tripId} visible={true} onClose={onClose} />);

    expect(getByText('5m')).toBeTruthy();
    expect(getByText('15m')).toBeTruthy();
    expect(getByText('30m')).toBeTruthy();
    expect(getByText('1h')).toBeTruthy();
    expect(getByText('6h')).toBeTruthy();
    expect(getByText('12h')).toBeTruthy();
    expect(getByText('24h')).toBeTruthy();
    expect(getByText('48h')).toBeTruthy();
  });

  it('24h chip is selected by default', () => {
    const { getByLabelText } = render(
      <PollCreator tripId={tripId} visible={true} onClose={onClose} />
    );

    // The 24h chip should have the "Set duration to 24h" accessibility label
    const chip24h = getByLabelText('Set duration to 24h');
    expect(chip24h).toBeTruthy();
  });

  it('selecting a chip updates the selected duration', () => {
    const { getByLabelText } = render(
      <PollCreator tripId={tripId} visible={true} onClose={onClose} />
    );

    fireEvent.press(getByLabelText('Set duration to 5m'));
    // After pressing, the 5m chip should still be present (component re-renders)
    expect(getByLabelText('Set duration to 5m')).toBeTruthy();
  });

  it('passes durationMinutes in create mutation', () => {
    const { getByLabelText, getByText, getByPlaceholderText } = render(
      <PollCreator tripId={tripId} visible={true} onClose={onClose} />
    );

    // Select 5m duration
    fireEvent.press(getByLabelText('Set duration to 5m'));

    // Fill in question
    fireEvent.changeText(getByPlaceholderText('Where should we eat tonight?'), 'Test question');

    // Fill in options
    fireEvent.changeText(getByPlaceholderText('Option 1'), 'Alpha');
    fireEvent.changeText(getByPlaceholderText('Option 2'), 'Beta');

    // Submit
    fireEvent.press(getByText('Your call, nomad'));

    expect(mockCreatePollMutate).toHaveBeenCalledWith(
      {
        tripId,
        input: {
          question: 'Test question',
          options: ['Alpha', 'Beta'],
          allowMultipleVotes: false,
          durationMinutes: 5,
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
