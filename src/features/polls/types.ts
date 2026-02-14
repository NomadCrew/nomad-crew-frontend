export type PollStatus = 'ACTIVE' | 'CLOSED';

export interface Poll {
  id: string;
  tripId: string;
  question: string;
  status: PollStatus;
  allowMultipleVotes: boolean;
  createdBy: string;
  closedBy: string | null;
  closedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  position: number;
  createdBy: string;
  createdAt: string;
}

export interface PollVoter {
  userId: string;
  createdAt: string;
}

export interface PollOptionWithVotes extends PollOption {
  voteCount: number;
  voters: PollVoter[];
  hasVoted: boolean;
}

export interface PollResponse extends Poll {
  options: PollOptionWithVotes[];
  totalVotes: number;
  userVoteCount: number;
}

export interface CreatePollInput {
  question: string;
  options: string[];
  allowMultipleVotes?: boolean;
  durationMinutes?: number;
}

export interface PollsResponse {
  data: PollResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
