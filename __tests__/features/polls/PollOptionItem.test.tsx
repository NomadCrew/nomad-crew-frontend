import React from 'react';
import { render, fireEvent } from '../../test-utils';
import { PollOptionItem } from '@/src/features/polls/components/PollOptionItem';
import { createPollOption } from '../../factories/poll.factory';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Check: (props: any) => <View testID="check-icon" {...props} />,
  };
});

// Mock VoteBar
jest.mock('@/src/features/polls/components/VoteBar', () => {
  const { View, Text } = require('react-native');
  return {
    VoteBar: ({ voteCount, totalVotes, isSelected, isClosed }: any) => (
      <View testID="vote-bar">
        <Text testID="vote-bar-count">{voteCount}</Text>
        <Text testID="vote-bar-total">{totalVotes}</Text>
      </View>
    ),
  };
});

describe('PollOptionItem', () => {
  const onVote = jest.fn();
  const onRemoveVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders option text', () => {
    const option = createPollOption({ text: 'Pizza Palace' });

    const { getByText } = render(
      <PollOptionItem
        option={option}
        totalVotes={10}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByText('Pizza Palace')).toBeTruthy();
  });

  it('renders VoteBar with correct props', () => {
    const option = createPollOption({ voteCount: 3 });

    const { getByTestId } = render(
      <PollOptionItem
        option={option}
        totalVotes={10}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByTestId('vote-bar')).toBeTruthy();
    expect(getByTestId('vote-bar-count').props.children).toBe(3);
    expect(getByTestId('vote-bar-total').props.children).toBe(10);
  });

  it('displays voter count text for options with voters', () => {
    const option = createPollOption({
      voters: [
        { userId: 'u1', createdAt: new Date().toISOString() },
        { userId: 'u2', createdAt: new Date().toISOString() },
      ],
    });

    const { getByText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByText('2 nomads voted')).toBeTruthy();
  });

  it('displays singular voter text for one voter', () => {
    const option = createPollOption({
      voters: [{ userId: 'u1', createdAt: new Date().toISOString() }],
    });

    const { getByText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByText('1 nomad voted')).toBeTruthy();
  });

  it('does not display voter text when no voters', () => {
    const option = createPollOption({ voters: [] });

    const { queryByText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(queryByText(/nomad/)).toBeNull();
  });

  it('calls onVote when pressed on an unvoted active option', () => {
    const option = createPollOption({ id: 'opt-1', hasVoted: false });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    fireEvent.press(getByLabelText(`Vote for ${option.text}`));
    expect(onVote).toHaveBeenCalledWith('opt-1');
    expect(onRemoveVote).not.toHaveBeenCalled();
  });

  it('calls onRemoveVote when pressed on a voted active option', () => {
    const option = createPollOption({ id: 'opt-2', hasVoted: true });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    fireEvent.press(getByLabelText(`Remove vote from ${option.text}`));
    expect(onRemoveVote).toHaveBeenCalledWith('opt-2');
    expect(onVote).not.toHaveBeenCalled();
  });

  it('does not call onVote or onRemoveVote when pressed on inactive option', () => {
    const option = createPollOption({ id: 'opt-3', hasVoted: false });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={false}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    fireEvent.press(getByLabelText(`Vote for ${option.text}`));
    expect(onVote).not.toHaveBeenCalled();
    expect(onRemoveVote).not.toHaveBeenCalled();
  });

  it('triggers haptic feedback on vote', () => {
    const Haptics = require('expo-haptics');
    const option = createPollOption({ hasVoted: false });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    fireEvent.press(getByLabelText(`Vote for ${option.text}`));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('triggers light haptic feedback on remove vote', () => {
    const Haptics = require('expo-haptics');
    const option = createPollOption({ hasVoted: true });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    fireEvent.press(getByLabelText(`Remove vote from ${option.text}`));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('sets correct accessibility label for unvoted option', () => {
    const option = createPollOption({ text: 'Tacos', hasVoted: false });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByLabelText('Vote for Tacos')).toBeTruthy();
  });

  it('sets correct accessibility label for voted option', () => {
    const option = createPollOption({ text: 'Tacos', hasVoted: true });

    const { getByLabelText } = render(
      <PollOptionItem
        option={option}
        totalVotes={5}
        isActive={true}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
      />
    );

    expect(getByLabelText('Remove vote from Tacos')).toBeTruthy();
  });
});
