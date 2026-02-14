import { formatCountdown } from '@/src/features/polls/utils';

describe('formatCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Expired" for past dates', () => {
    expect(formatCountdown('2026-01-15T11:00:00Z')).toBe('Expired');
  });

  it('returns "< 1m left" for less than 1 minute remaining', () => {
    expect(formatCountdown('2026-01-15T12:00:30Z')).toBe('< 1m left');
  });

  it('returns "Xm left" for less than 60 minutes', () => {
    expect(formatCountdown('2026-01-15T12:30:00Z')).toBe('30m left');
  });

  it('returns "Xh Ym left" for less than 24 hours', () => {
    expect(formatCountdown('2026-01-15T14:15:00Z')).toBe('2h 15m left');
  });

  it('returns "Xh left" when exactly on the hour', () => {
    expect(formatCountdown('2026-01-15T15:00:00Z')).toBe('3h left');
  });

  it('returns "Xd Yh left" for >= 24 hours', () => {
    expect(formatCountdown('2026-01-16T17:00:00Z')).toBe('1d 5h left');
  });

  it('returns "Xd left" when exactly on the day', () => {
    expect(formatCountdown('2026-01-17T12:00:00Z')).toBe('2d left');
  });
});
