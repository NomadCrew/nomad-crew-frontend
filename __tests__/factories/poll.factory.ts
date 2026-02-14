import type { PollResponse, PollOptionWithVotes, PollVoter } from '@/src/features/polls/types';

let pollCounter = 0;
let optionCounter = 0;

export const createPollOption = (
  overrides: Partial<PollOptionWithVotes> = {}
): PollOptionWithVotes => {
  const id = `option-${++optionCounter}`;
  return {
    id,
    pollId: 'poll-1',
    text: `Option ${optionCounter}`,
    position: optionCounter,
    createdBy: 'user-creator',
    createdAt: new Date().toISOString(),
    voteCount: 0,
    voters: [],
    hasVoted: false,
    ...overrides,
  };
};

export const createPollResponse = (overrides: Partial<PollResponse> = {}): PollResponse => {
  const id = `poll-${++pollCounter}`;
  const options = overrides.options ?? [
    createPollOption({ pollId: id, text: 'Option A', position: 1 }),
    createPollOption({ pollId: id, text: 'Option B', position: 2 }),
  ];
  const totalVotes = overrides.totalVotes ?? options.reduce((sum, o) => sum + o.voteCount, 0);

  return {
    id,
    tripId: 'trip-123',
    question: 'Where should we eat?',
    status: 'ACTIVE',
    allowMultipleVotes: false,
    createdBy: 'user-creator',
    closedBy: null,
    closedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options,
    totalVotes,
    userVoteCount: 0,
    ...overrides,
  };
};

export const createPollVoter = (overrides: Partial<PollVoter> = {}): PollVoter => ({
  userId: 'user-voter',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createClosedPoll = (overrides: Partial<PollResponse> = {}): PollResponse =>
  createPollResponse({
    status: 'CLOSED',
    closedBy: 'user-creator',
    closedAt: new Date().toISOString(),
    ...overrides,
  });

export const createPollWithVotes = (overrides: Partial<PollResponse> = {}): PollResponse => {
  const voter1 = createPollVoter({ userId: 'user-1' });
  const voter2 = createPollVoter({ userId: 'user-2' });
  const options = [
    createPollOption({
      text: 'Pizza',
      position: 1,
      voteCount: 2,
      voters: [voter1, voter2],
      hasVoted: false,
    }),
    createPollOption({
      text: 'Sushi',
      position: 2,
      voteCount: 1,
      voters: [createPollVoter({ userId: 'user-3' })],
      hasVoted: true,
    }),
  ];

  return createPollResponse({
    options,
    totalVotes: 3,
    userVoteCount: 1,
    ...overrides,
  });
};
