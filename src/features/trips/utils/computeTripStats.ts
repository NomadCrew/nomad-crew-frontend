import type { Trip } from '../types';

export interface ProfileTripStats {
  /** Count of COMPLETED trips */
  completedTrips: number;
  /** Unique calendar days across all COMPLETED trips (overlaps merged) */
  uniqueDaysTraveled: number;
  /** Unique destination count from COMPLETED trips (case-insensitive, trimmed) */
  uniqueDestinations: number;
}

const DAY_MS = 86_400_000; // 24 * 60 * 60 * 1000

/**
 * Parse a date string and return the UTC timestamp at midnight of that day.
 * Strips the time component to avoid timezone-offset day shifts.
 * Handles: "2026-06-01", "2026-06-01T00:00:00Z", "2026-06-01T00:00:00+05:30"
 */
function toUTCDayMs(dateStr: string): number {
  // Extract YYYY-MM-DD prefix to avoid timezone offset shifting the calendar day.
  // e.g., "2026-06-01T00:00:00+05:30" would become May 31 in UTC if parsed directly.
  const dateOnly = dateStr.slice(0, 10); // "YYYY-MM-DD"
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return 0;
  return Date.UTC(year, month - 1, day);
}

/**
 * Compute profile stats from a list of trips.
 *
 * Only COMPLETED trips are counted. Overlapping date ranges are merged
 * so each calendar day is counted at most once.
 *
 * Algorithm: classic interval merge (sort by start, extend or create new interval).
 * Time: O(n log n) for sort. Space: O(n) worst case for merged intervals.
 */
export function computeTripStats(trips: Trip[]): ProfileTripStats {
  const completed = trips.filter((t) => t.status === 'COMPLETED');

  if (completed.length === 0) {
    return { completedTrips: 0, uniqueDaysTraveled: 0, uniqueDestinations: 0 };
  }

  // --- Unique days calculation via interval merge ---
  const intervals = completed
    .map((t) => {
      const start = toUTCDayMs(t.startDate);
      const end = toUTCDayMs(t.endDate);
      // Guard: if end < start (bad data), swap them
      return { start: Math.min(start, end), end: Math.max(start, end) };
    })
    .sort((a, b) => a.start - b.start);

  // Merge overlapping/adjacent intervals
  const firstInterval = intervals[0]!;
  const merged: { start: number; end: number }[] = [firstInterval];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i]!;
    const last = merged[merged.length - 1]!;

    // Overlap or adjacent (next day starts where previous ends + 1 day)
    if (current.start <= last.end + DAY_MS) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }

  // Count days: each interval contributes (end - start) / DAY_MS + 1 days
  // The +1 is because both start and end dates are inclusive
  const uniqueDaysTraveled = merged.reduce((sum, interval) => {
    return sum + Math.round((interval.end - interval.start) / DAY_MS) + 1;
  }, 0);

  // --- Destination count ---
  // Use destination.name if available, fall back to first segment of address
  // (e.g., "Paris" from "Paris, France"). This ensures trips with name "Paris"
  // and trips with only address "Paris, France" deduplicate correctly.
  // Case-insensitive, trimmed.
  const destinations = new Set(
    completed
      .map((t) => {
        if (!t.destination || typeof t.destination !== 'object') return '';
        const name = t.destination.name?.trim();
        if (name) return name.toLowerCase();
        // Fallback: use first comma-separated segment of address as the place name
        const address = t.destination.address?.trim() || '';
        const firstSegment = address.split(',')[0]?.trim() || '';
        return firstSegment.toLowerCase();
      })
      .filter(Boolean)
  );

  return {
    completedTrips: completed.length,
    uniqueDaysTraveled,
    uniqueDestinations: destinations.size,
  };
}
