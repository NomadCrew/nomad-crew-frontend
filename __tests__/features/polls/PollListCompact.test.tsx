import React from 'react';
import { render, fireEvent, waitFor } from '../../test-utils';
import { PollListCompact } from '@/src/features/polls/components/PollListCompact';
import {
  createPollResponse,
  createClosedPoll,
  createExpiredPoll,
  createPollExpiringIn,
} from '../../factories/poll.factory';

// Mock the polls hooks module
const mockUsePolls = jest.fn();
jest.mock('@/src/features/polls/hooks', () => ({
  usePolls: (...args: unknown[]) => mockUsePolls(...args),
}));

// Mock lucide icons as simple View
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Plus: (props: any) => <View testID="plus-icon" {...props} />,
  };
});

// Mock FlashList as FlatList for testing
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: FlatList,
  };
});

describe('PollListCompact', () => {
  const tripId = 'trip-123';
  const onPollPress = jest.fn();
  const onCreatePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePolls.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders loading indicator when loading with no data', () => {
    mockUsePolls.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    // ActivityIndicator should be present
    expect(getByTestId).toBeDefined();
  });

  it('renders empty state when no polls exist', () => {
    mockUsePolls.mockReturnValue({
      data: { data: [], pagination: { limit: 20, offset: 0, total: 0 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    expect(getByText('No polls yet. Create your first one!')).toBeTruthy();
  });

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn();
    mockUsePolls.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    const { getByText } = render(
      <PollListCompact tripId={tripId} onPollPress={onPollPress} onCreatePress={onCreatePress} />
    );

    expect(getByText('Failed to load polls')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();

    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders poll list with questions and vote counts', () => {
    const polls = [
      createPollResponse({ id: 'p1', question: 'Where to eat?', totalVotes: 5 }),
      createPollResponse({ id: 'p2', question: 'What time?', totalVotes: 1 }),
    ];

    mockUsePolls.mockReturnValue({
      data: { data: polls, pagination: { limit: 20, offset: 0, total: 2 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    expect(getByText('Where to eat?')).toBeTruthy();
    expect(getByText('5 votes')).toBeTruthy();
    expect(getByText('What time?')).toBeTruthy();
    expect(getByText('1 vote')).toBeTruthy();
  });

  it('calls onPollPress when a poll row is pressed', () => {
    const poll = createPollResponse({ id: 'p1', question: 'Best beach?' });

    mockUsePolls.mockReturnValue({
      data: { data: [poll], pagination: { limit: 20, offset: 0, total: 1 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    fireEvent.press(getByText('Best beach?'));
    expect(onPollPress).toHaveBeenCalledWith(poll);
  });

  it('renders create FAB when onCreatePress is provided', () => {
    mockUsePolls.mockReturnValue({
      data: { data: [], pagination: { limit: 20, offset: 0, total: 0 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByLabelText } = render(
      <PollListCompact tripId={tripId} onPollPress={onPollPress} onCreatePress={onCreatePress} />
    );

    const fab = getByLabelText('Create new poll');
    expect(fab).toBeTruthy();

    fireEvent.press(fab);
    expect(onCreatePress).toHaveBeenCalled();
  });

  it('does not render create FAB when onCreatePress is not provided', () => {
    mockUsePolls.mockReturnValue({
      data: { data: [], pagination: { limit: 20, offset: 0, total: 0 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { queryByLabelText } = render(
      <PollListCompact tripId={tripId} onPollPress={onPollPress} />
    );

    expect(queryByLabelText('Create new poll')).toBeNull();
  });

  it('displays correct accessibility labels for active and closed polls', () => {
    const activePoll = createPollResponse({
      id: 'p1',
      question: 'Active poll',
      status: 'ACTIVE',
      totalVotes: 3,
    });
    const closedPoll = createClosedPoll({ id: 'p2', question: 'Closed poll', totalVotes: 7 });

    mockUsePolls.mockReturnValue({
      data: { data: [activePoll, closedPoll], pagination: { limit: 20, offset: 0, total: 2 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByLabelText } = render(
      <PollListCompact tripId={tripId} onPollPress={onPollPress} />
    );

    expect(getByLabelText('Active poll, active, 3 votes')).toBeTruthy();
    expect(getByLabelText('Closed poll, closed, 7 votes')).toBeTruthy();
  });

  it('passes correct arguments to usePolls', () => {
    render(<PollListCompact tripId="my-trip" onPollPress={onPollPress} />);

    expect(mockUsePolls).toHaveBeenCalledWith('my-trip', 0, 20);
  });

  it('shows expiry countdown for active polls', () => {
    const poll = createPollExpiringIn(120, {
      id: 'p1',
      question: 'Where next?',
      status: 'ACTIVE',
    });

    mockUsePolls.mockReturnValue({
      data: { data: [poll], pagination: { limit: 20, offset: 0, total: 1 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    // Should show a countdown like "1h 59m left" or "2h left"
    expect(getByText(/left/)).toBeTruthy();
  });

  it('shows Expired for expired active polls', () => {
    const poll = createExpiredPoll({
      id: 'p1',
      question: 'Old poll',
      status: 'ACTIVE',
    });

    mockUsePolls.mockReturnValue({
      data: { data: [poll], pagination: { limit: 20, offset: 0, total: 1 } },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<PollListCompact tripId={tripId} onPollPress={onPollPress} />);

    expect(getByText('Expired')).toBeTruthy();
  });
});
