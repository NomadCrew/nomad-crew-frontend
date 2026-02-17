import { computeTripStats, ProfileTripStats } from '@/src/features/trips/utils/computeTripStats';
import { createMockTrip, createMockCompletedTrip } from '../../factories/trip.factory';
import { Trip } from '@/src/features/trips/types';

/**
 * Helper: create a COMPLETED trip with specific date range and optional destination.
 */
function completedTrip(
  startDate: string,
  endDate: string,
  destination?: { address: string; name?: string }
): Trip {
  return createMockCompletedTrip({
    startDate,
    endDate,
    ...(destination ? { destination: { ...destination } } : {}),
  });
}

describe('computeTripStats', () => {
  // ── Edge Cases ──────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('1. returns all zeros for an empty array', () => {
      const result = computeTripStats([]);

      expect(result).toEqual<ProfileTripStats>({
        completedTrips: 0,
        uniqueDaysTraveled: 0,
        uniqueDestinations: 0,
      });
    });

    it('2. returns all zeros when no trips are COMPLETED', () => {
      const trips = [
        createMockTrip({ status: 'PLANNING', startDate: '2026-06-01', endDate: '2026-06-10' }),
        createMockTrip({ status: 'ACTIVE', startDate: '2026-06-01', endDate: '2026-06-10' }),
        createMockTrip({ status: 'CANCELLED', startDate: '2026-06-01', endDate: '2026-06-10' }),
      ];

      const result = computeTripStats(trips);

      expect(result).toEqual<ProfileTripStats>({
        completedTrips: 0,
        uniqueDaysTraveled: 0,
        uniqueDestinations: 0,
      });
    });

    it('4. same-day trip (startDate === endDate) counts as 1 day', () => {
      const trips = [completedTrip('2026-06-01', '2026-06-01')];

      const result = computeTripStats(trips);

      expect(result.uniqueDaysTraveled).toBe(1);
      expect(result.completedTrips).toBe(1);
    });

    it('12. auto-corrects when endDate < startDate (bad data)', () => {
      const trips = [completedTrip('2026-06-10', '2026-06-01')];

      const result = computeTripStats(trips);

      // Should swap and treat as June 1-10 = 10 days
      expect(result.uniqueDaysTraveled).toBe(10);
      expect(result.completedTrips).toBe(1);
    });
  });

  // ── Single Trip ─────────────────────────────────────────────────────────────

  describe('single trip', () => {
    it('3. single 10-day trip returns 10 days', () => {
      const trips = [completedTrip('2026-06-01', '2026-06-10')];

      const result = computeTripStats(trips);

      expect(result.uniqueDaysTraveled).toBe(10);
      expect(result.completedTrips).toBe(1);
    });
  });

  // ── Interval Merging ────────────────────────────────────────────────────────

  describe('interval merging', () => {
    it('5. two non-overlapping trips (June 1-5, June 10-15) = 11 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05'),
        completedTrip('2026-06-10', '2026-06-15'),
      ];

      const result = computeTripStats(trips);

      // June 1-5 = 5 days, June 10-15 = 6 days => 11 days
      expect(result.uniqueDaysTraveled).toBe(11);
    });

    it('6. two adjacent trips (June 1-5, June 6-10) = 10 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05'),
        completedTrip('2026-06-06', '2026-06-10'),
      ];

      const result = computeTripStats(trips);

      // Adjacent intervals merge: June 1-10 = 10 days
      expect(result.uniqueDaysTraveled).toBe(10);
    });

    it('7. two overlapping trips (June 1-10, June 5-15) = 15 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-10'),
        completedTrip('2026-06-05', '2026-06-15'),
      ];

      const result = computeTripStats(trips);

      // Merged: June 1-15 = 15 days
      expect(result.uniqueDaysTraveled).toBe(15);
    });

    it('8. full containment (June 1-30, June 10-15) = 30 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-30'),
        completedTrip('2026-06-10', '2026-06-15'),
      ];

      const result = computeTripStats(trips);

      // Inner trip fully contained; merged = June 1-30 = 30 days
      expect(result.uniqueDaysTraveled).toBe(30);
    });

    it('9. three trips, mixed overlap (June 1-10, June 5-15, June 20-25) = 21 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-10'),
        completedTrip('2026-06-05', '2026-06-15'),
        completedTrip('2026-06-20', '2026-06-25'),
      ];

      const result = computeTripStats(trips);

      // Merged: [June 1-15] + [June 20-25] = 15 + 6 = 21 days
      expect(result.uniqueDaysTraveled).toBe(21);
    });

    it('10. identical trips (June 1-10, June 1-10) = 10 days', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-10'),
        completedTrip('2026-06-01', '2026-06-10'),
      ];

      const result = computeTripStats(trips);

      expect(result.uniqueDaysTraveled).toBe(10);
    });
  });

  // ── Status Filtering ────────────────────────────────────────────────────────

  describe('status filtering', () => {
    it('11. only counts COMPLETED trips, ignores other statuses', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-10'),
        createMockTrip({ status: 'ACTIVE', startDate: '2026-06-05', endDate: '2026-06-15' }),
        createMockTrip({ status: 'PLANNING', startDate: '2026-06-20', endDate: '2026-06-25' }),
        createMockTrip({ status: 'CANCELLED', startDate: '2026-06-01', endDate: '2026-06-30' }),
      ];

      const result = computeTripStats(trips);

      // Only the COMPLETED trip counts: June 1-10 = 10 days
      expect(result.uniqueDaysTraveled).toBe(10);
      expect(result.completedTrips).toBe(1);
    });
  });

  // ── Destination Counting ────────────────────────────────────────────────────

  describe('destination counting', () => {
    it('13. counts unique destinations case-insensitively', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05', { address: 'Paris, France', name: 'Paris' }),
        completedTrip('2026-07-01', '2026-07-05', { address: 'paris, france', name: 'paris' }),
      ];

      const result = computeTripStats(trips);

      // "Paris" and "paris" should be treated as the same destination
      expect(result.uniqueDestinations).toBe(1);
    });

    it('13b. counts different destinations separately', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05', { address: 'Paris, France', name: 'Paris' }),
        completedTrip('2026-07-01', '2026-07-05', { address: 'Tokyo, Japan', name: 'Tokyo' }),
      ];

      const result = computeTripStats(trips);

      expect(result.uniqueDestinations).toBe(2);
    });

    it('14. falls back to address when name is missing', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05', { address: 'Paris, France' }),
        completedTrip('2026-07-01', '2026-07-05', { address: 'Paris, France' }),
      ];

      const result = computeTripStats(trips);

      // Both use address "Paris, France" — should be 1 unique destination
      expect(result.uniqueDestinations).toBe(1);
    });

    it('14b. name takes priority over address for deduplication', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05', {
          address: '123 Rue de Rivoli, Paris',
          name: 'Paris',
        }),
        completedTrip('2026-07-01', '2026-07-05', {
          address: '456 Champs-Elysees, Paris',
          name: 'Paris',
        }),
      ];

      const result = computeTripStats(trips);

      // Both have name "Paris" despite different addresses
      expect(result.uniqueDestinations).toBe(1);
    });

    it('handles whitespace-only destination names by falling back to address', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-05', { address: 'Tokyo, Japan', name: '   ' }),
      ];

      const result = computeTripStats(trips);

      // Whitespace-only name should fall back to address
      expect(result.uniqueDestinations).toBe(1);
    });
  });

  // ── Completeness ────────────────────────────────────────────────────────────

  describe('completedTrips count', () => {
    it('counts all COMPLETED trips regardless of date overlap', () => {
      const trips = [
        completedTrip('2026-06-01', '2026-06-10'),
        completedTrip('2026-06-01', '2026-06-10'),
        completedTrip('2026-06-01', '2026-06-10'),
      ];

      const result = computeTripStats(trips);

      expect(result.completedTrips).toBe(3);
      // Days should still be 10 (all overlap)
      expect(result.uniqueDaysTraveled).toBe(10);
    });
  });
});
