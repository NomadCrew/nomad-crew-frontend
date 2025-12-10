/**
 * Member Color Assignment Utility
 *
 * Assigns random but consistent colors to trip members using a seeded
 * random algorithm. Colors are shuffled per-trip for variety while
 * ensuring no duplicates within the palette size - like a game!
 */

/**
 * Curated color palette designed for:
 * - High distinguishability between colors
 * - Good contrast on map tiles (both light and satellite)
 * - Accessibility considerations (avoids problematic color pairs)
 * - Pleasant, modern aesthetic
 */
export const MEMBER_COLORS = [
  '#E57373', // Coral Red
  '#64B5F6', // Sky Blue
  '#81C784', // Soft Green
  '#FFB74D', // Warm Orange
  '#BA68C8', // Purple
  '#4DD0E1', // Cyan
  '#F06292', // Pink
  '#AED581', // Light Green
  '#7986CB', // Indigo
  '#FFD54F', // Yellow
] as const;

export type MemberColor = (typeof MEMBER_COLORS)[number];

export interface TripMember {
  userId: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

/**
 * Simple seeded random number generator (Mulberry32).
 * Produces deterministic sequence from a seed, ensuring same colors across devices.
 */
function seededRandom(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a seed from a string (tripId) for deterministic randomness.
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle with seeded random for deterministic results.
 */
function shuffleWithSeed<T>(array: readonly T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp!;
  }
  return shuffled;
}

/**
 * Gets the assigned color for a member using random shuffle per trip.
 *
 * Algorithm:
 * 1. Use tripId as seed to shuffle color palette (deterministic randomness)
 * 2. Sort members by joinedAt to establish stable order
 * 3. Assign shuffled colors based on join order
 *
 * Benefits:
 * - Random colors add element of surprise (like games!)
 * - Same tripId always produces same shuffle (consistent across devices)
 * - No conflicts within palette size (10 members)
 * - Different trips get different color arrangements
 *
 * @param members - Array of trip members
 * @param memberId - The userId to get the color for
 * @param tripId - The trip ID used as seed for random shuffle
 * @returns The assigned color hex string
 */
export function getMemberColor(
  members: TripMember[],
  memberId: string,
  tripId?: string
): MemberColor {
  if (!members || members.length === 0) {
    return MEMBER_COLORS[0];
  }

  // Create seeded random from tripId for deterministic shuffle
  const seed = tripId ? stringToSeed(tripId) : 0;
  const random = seededRandom(seed);

  // Shuffle the color palette using the trip seed
  const shuffledColors = shuffleWithSeed(MEMBER_COLORS, random);

  // Sort members by join date for stable ordering
  const sortedMembers = [...members].sort((a, b) => {
    const dateA = new Date(a.joinedAt).getTime();
    const dateB = new Date(b.joinedAt).getTime();
    return dateA - dateB;
  });

  // Find the member's index
  const index = sortedMembers.findIndex((m) => m.userId === memberId);

  // Return shuffled color at index
  if (index === -1) {
    // Member not found - use hash of oderId for fallback
    const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return shuffledColors[hash % shuffledColors.length] as MemberColor;
  }

  return shuffledColors[index % shuffledColors.length] as MemberColor;
}

/**
 * Gets all member colors for a trip as a map.
 * Useful for consistent color usage across multiple components.
 *
 * @param members - Array of trip members
 * @param tripId - The trip ID used as seed for random shuffle
 * @returns Map of userId to color
 */
export function getMemberColorMap(
  members: TripMember[],
  tripId?: string
): Map<string, MemberColor> {
  const colorMap = new Map<string, MemberColor>();

  if (!members || members.length === 0) {
    return colorMap;
  }

  // Create seeded random from tripId
  const seed = tripId ? stringToSeed(tripId) : 0;
  const random = seededRandom(seed);

  // Shuffle colors for this trip
  const shuffledColors = shuffleWithSeed(MEMBER_COLORS, random);

  // Sort members by join date
  const sortedMembers = [...members].sort((a, b) => {
    const dateA = new Date(a.joinedAt).getTime();
    const dateB = new Date(b.joinedAt).getTime();
    return dateA - dateB;
  });

  // Assign shuffled colors
  sortedMembers.forEach((member, index) => {
    colorMap.set(member.userId, shuffledColors[index % shuffledColors.length] as MemberColor);
  });

  return colorMap;
}

/**
 * Maximum number of members that can have unique colors.
 * Beyond this, colors will repeat.
 */
export const MAX_UNIQUE_COLORS = MEMBER_COLORS.length;
