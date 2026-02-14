import React from 'react';
import { render, fireEvent } from '../../test-utils';
import { PollDetailSheet } from '@/src/features/polls/components/PollDetailSheet';
import {
  createPollResponse,
  createClosedPoll,
  createPollWithVotes,
  createExpiredPoll,
  createPollExpiringIn,
} from '../../factories/poll.factory';

// Mock hooks
const mockCastVoteMutate = jest.fn();
const mockRemoveVoteMutate = jest.fn();
const mockClosePollMutate = jest.fn();
const mockDeletePollMutate = jest.fn();

jest.mock('@/src/features/polls/hooks', () => ({
  usePoll: () => ({ data: undefined }),
  useCastVote: () => ({ mutate: mockCastVoteMutate }),
  useRemoveVote: () => ({ mutate: mockRemoveVoteMutate }),
  useClosePoll: () => ({ mutate: mockClosePollMutate }),
  useDeletePoll: () => ({ mutate: mockDeletePollMutate }),
}));

// Mock trip hooks
const mockUseTripMembers = jest.fn(() => ({
  data: [{ userId: 'user-1' }, { userId: 'user-2' }],
}));
jest.mock('@/src/features/trips/hooks', () => ({
  useTripMembers: (...args: unknown[]) => mockUseTripMembers(...args),
}));

// Mock permissions
const mockAbility = {
  can: jest.fn().mockReturnValue(false),
};
jest.mock('@/src/features/auth/permissions', () => ({
  useTripAbility: () => ({ ability: mockAbility }),
}));

// Mock AppBottomSheet as a simple wrapper that renders children when visible
jest.mock('@/src/components/molecules/AppBottomSheet/AppBottomSheet', () => {
  const { View } = require('react-native');
  return {
    AppBottomSheet: ({ visible, children, onClose }: any) =>
      visible ? <View testID="bottom-sheet">{children}</View> : null,
  };
});

// Mock lucide icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Lock: (props: any) => <View testID="lock-icon" {...props} />,
    Trash2: (props: any) => <View testID="trash-icon" {...props} />,
    Check: (props: any) => <View testID="check-icon" {...props} />,
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Mock VoteBar as a simple view
jest.mock('@/src/features/polls/components/VoteBar', () => {
  const { View, Text } = require('react-native');
  return {
    VoteBar: ({ voteCount, totalVotes }: any) => (
      <View testID="vote-bar">
        <Text>
          {voteCount} of {totalVotes}
        </Text>
      </View>
    ),
  };
});

describe('PollDetailSheet', () => {
  const tripId = 'trip-123';
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAbility.can.mockReturnValue(false);
    mockUseTripMembers.mockReturnValue({
      data: [{ userId: 'user-1' }, { userId: 'user-2' }],
    });
  });

  it('renders nothing when not visible', () => {
    const poll = createPollResponse();

    const { queryByTestId } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={false} onClose={onClose} />
    );

    expect(queryByTestId('bottom-sheet')).toBeNull();
  });

  it('renders nothing inside sheet when poll is null', () => {
    const { queryByText } = render(
      <PollDetailSheet tripId={tripId} poll={null} visible={true} onClose={onClose} />
    );

    // The sheet wrapper renders but the content guard (poll &&) prevents rendering
    expect(queryByText('Where should we eat?')).toBeNull();
  });

  it('renders poll question when visible with a poll', () => {
    const poll = createPollResponse({ question: 'Best destination?' });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('Best destination?')).toBeTruthy();
  });

  it('renders LIVE badge for active polls', () => {
    const poll = createPollResponse({ status: 'ACTIVE' });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('LIVE')).toBeTruthy();
  });

  it('renders CLOSED badge for closed polls', () => {
    const poll = createClosedPoll();

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('CLOSED')).toBeTruthy();
  });

  it('renders all poll options sorted by position', () => {
    const poll = createPollResponse();

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    // Options from the factory: Option A, Option B
    poll.options.forEach((opt) => {
      expect(getByText(opt.text)).toBeTruthy();
    });
  });

  it('renders multi-vote badge when allowMultipleVotes is true', () => {
    const poll = createPollResponse({ allowMultipleVotes: true });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('Multi-vote')).toBeTruthy();
  });

  it('does not render multi-vote badge when allowMultipleVotes is false', () => {
    const poll = createPollResponse({ allowMultipleVotes: false });

    const { queryByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(queryByText('Multi-vote')).toBeNull();
  });

  it('shows prompt text for active polls with no user votes', () => {
    const poll = createPollResponse({ status: 'ACTIVE', userVoteCount: 0 });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('Drop your vote, nomad')).toBeTruthy();
  });

  it('shows closed text for closed polls', () => {
    const poll = createClosedPoll();

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText('The tribe has spoken')).toBeTruthy();
  });

  it('shows vote summary when there are votes', () => {
    const poll = createPollResponse({ totalVotes: 5 });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText(/5 votes cast/)).toBeTruthy();
  });

  it('shows singular vote text for 1 vote', () => {
    const poll = createPollResponse({ totalVotes: 1 });

    const { getByText } = render(
      <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
    );

    expect(getByText(/1 vote cast/)).toBeTruthy();
  });

  describe('actions visibility', () => {
    it('shows close button when user canClose an active expired poll', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createExpiredPoll({ status: 'ACTIVE' });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByLabelText('Close poll')).toBeTruthy();
    });

    it('hides close button for closed polls even if user has permission', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createClosedPoll();

      const { queryByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(queryByLabelText('Close poll')).toBeNull();
    });

    it('hides close button when user lacks permission', () => {
      mockAbility.can.mockReturnValue(false);
      const poll = createPollResponse({ status: 'ACTIVE' });

      const { queryByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(queryByLabelText('Close poll')).toBeNull();
    });

    it('shows delete button when user canDelete', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createPollResponse();

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByLabelText('Delete poll')).toBeTruthy();
    });

    it('hides delete button when user lacks permission', () => {
      mockAbility.can.mockReturnValue(false);
      const poll = createPollResponse();

      const { queryByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(queryByLabelText('Delete poll')).toBeNull();
    });
  });

  describe('expiration and all-voted behavior', () => {
    it('shows countdown for active unexpired poll', () => {
      const poll = createPollExpiringIn(120); // 2 hours from now

      const { getByText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      // The meta line should contain the countdown (e.g., "2h 0m left" or "1h 59m left")
      expect(getByText(/\d+h.*left/)).toBeTruthy();
    });

    it('shows Expired in meta for active expired poll', () => {
      const poll = createExpiredPoll({ status: 'ACTIVE' });

      const { getByText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByText(/Expired/)).toBeTruthy();
    });

    it('hides close button when poll active and not expired and not all voted', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createPollExpiringIn(60, { status: 'ACTIVE' });

      const { queryByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(queryByLabelText('Close poll')).toBeNull();
    });

    it('shows close button when poll is expired', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createExpiredPoll({ status: 'ACTIVE' });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByLabelText('Close poll')).toBeTruthy();
    });

    it('shows close button when all members have voted', () => {
      mockAbility.can.mockReturnValue(true);
      mockUseTripMembers.mockReturnValue({
        data: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });

      const poll = createPollExpiringIn(60, {
        status: 'ACTIVE',
        options: [
          {
            id: 'opt-1',
            pollId: 'poll-1',
            text: 'A',
            position: 1,
            createdBy: 'user-creator',
            createdAt: new Date().toISOString(),
            voteCount: 1,
            voters: [{ userId: 'user-1', createdAt: new Date().toISOString() }],
            hasVoted: false,
          },
          {
            id: 'opt-2',
            pollId: 'poll-1',
            text: 'B',
            position: 2,
            createdBy: 'user-creator',
            createdAt: new Date().toISOString(),
            voteCount: 1,
            voters: [{ userId: 'user-2', createdAt: new Date().toISOString() }],
            hasVoted: false,
          },
        ],
        totalVotes: 2,
      });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByLabelText('Close poll')).toBeTruthy();
    });

    it('shows "All nomads have voted" when all members voted', () => {
      mockUseTripMembers.mockReturnValue({
        data: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });

      const poll = createPollExpiringIn(60, {
        status: 'ACTIVE',
        options: [
          {
            id: 'opt-1',
            pollId: 'poll-1',
            text: 'A',
            position: 1,
            createdBy: 'user-creator',
            createdAt: new Date().toISOString(),
            voteCount: 1,
            voters: [{ userId: 'user-1', createdAt: new Date().toISOString() }],
            hasVoted: false,
          },
          {
            id: 'opt-2',
            pollId: 'poll-1',
            text: 'B',
            position: 2,
            createdBy: 'user-creator',
            createdAt: new Date().toISOString(),
            voteCount: 1,
            voters: [{ userId: 'user-2', createdAt: new Date().toISOString() }],
            hasVoted: false,
          },
        ],
        totalVotes: 2,
        userVoteCount: 1,
      });

      const { getByText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      expect(getByText('All nomads have voted')).toBeTruthy();
    });
  });

  describe('action handlers', () => {
    it('calls closePoll.mutate when close button is pressed', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createExpiredPoll({ id: 'poll-99', status: 'ACTIVE' });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      fireEvent.press(getByLabelText('Close poll'));
      expect(mockClosePollMutate).toHaveBeenCalledWith({ tripId, pollId: 'poll-99' });
    });

    it('calls deletePoll.mutate when delete button is pressed', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createPollResponse({ id: 'poll-99' });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      fireEvent.press(getByLabelText('Delete poll'));
      expect(mockDeletePollMutate).toHaveBeenCalledWith(
        { tripId, pollId: 'poll-99' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('calls onClose after successful delete', () => {
      mockAbility.can.mockReturnValue(true);
      const poll = createPollResponse({ id: 'poll-99' });

      const { getByLabelText } = render(
        <PollDetailSheet tripId={tripId} poll={poll} visible={true} onClose={onClose} />
      );

      fireEvent.press(getByLabelText('Delete poll'));

      // Extract and call the onSuccess callback
      const callArgs = mockDeletePollMutate.mock.calls[0];
      const options = callArgs[1];
      options.onSuccess();

      expect(onClose).toHaveBeenCalled();
    });
  });
});
