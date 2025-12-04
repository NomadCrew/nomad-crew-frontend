import { Trip, TripStatus } from '@/src/types/trip';

/**
 * Creates a mock Trip object for testing.
 *
 * @param overrides - Partial trip properties to override defaults
 * @returns A complete Trip object with test data
 *
 * @example
 * // Create a basic trip
 * const trip = createMockTrip();
 *
 * @example
 * // Create a trip with custom properties
 * const customTrip = createMockTrip({
 *   name: 'Paris Adventure',
 *   status: 'ACTIVE',
 *   members: [createMockMember()]
 * });
 */
export const createMockTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: 'trip-123',
  name: 'Test Trip',
  description: 'A test trip',
  startDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  endDate: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
  destination: {
    address: 'Paris, France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    placeId: 'place-123',
  },
  status: 'PLANNING' as TripStatus,
  createdBy: 'user-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  members: [],
  invitations: [],
  ...overrides,
});

/**
 * Creates a mock Trip member object.
 *
 * @param overrides - Partial member properties to override defaults
 * @returns A trip member object
 *
 * @example
 * const member = createMockMember({ role: 'admin' });
 */
export const createMockMember = (overrides: Partial<{
  userId: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}> = {}) => ({
  userId: 'user-123',
  name: 'Test User',
  role: 'member' as const,
  joinedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock Trip with a full member list (owner + members).
 *
 * @param memberCount - Number of additional members to add (default: 2)
 * @param overrides - Partial trip properties to override defaults
 * @returns A Trip object with populated members
 *
 * @example
 * const tripWithMembers = createMockTripWithMembers(3);
 */
export const createMockTripWithMembers = (
  memberCount: number = 2,
  overrides: Partial<Trip> = {}
): Trip => {
  const owner = createMockMember({
    userId: 'owner-123',
    name: 'Trip Owner',
    role: 'owner',
  });

  const members = Array.from({ length: memberCount }, (_, i) =>
    createMockMember({
      userId: `member-${i + 1}`,
      name: `Member ${i + 1}`,
      role: 'member',
    })
  );

  return createMockTrip({
    createdBy: owner.userId,
    members: [owner, ...members],
    ...overrides,
  });
};

/**
 * Creates a mock Trip in the ACTIVE status.
 *
 * @param overrides - Partial trip properties to override defaults
 * @returns A Trip object with ACTIVE status
 *
 * @example
 * const activeTrip = createMockActiveTrip();
 */
export const createMockActiveTrip = (overrides: Partial<Trip> = {}): Trip =>
  createMockTrip({
    status: 'ACTIVE',
    startDate: new Date(Date.now() - 86400000).toISOString(), // started yesterday
    endDate: new Date(Date.now() + 604800000).toISOString(), // ends in 7 days
    ...overrides,
  });

/**
 * Creates a mock Trip in the COMPLETED status.
 *
 * @param overrides - Partial trip properties to override defaults
 * @returns A Trip object with COMPLETED status
 *
 * @example
 * const completedTrip = createMockCompletedTrip();
 */
export const createMockCompletedTrip = (overrides: Partial<Trip> = {}): Trip =>
  createMockTrip({
    status: 'COMPLETED',
    startDate: new Date(Date.now() - 1209600000).toISOString(), // started 14 days ago
    endDate: new Date(Date.now() - 604800000).toISOString(), // ended 7 days ago
    ...overrides,
  });

/**
 * Creates a mock Trip with weather data.
 *
 * @param overrides - Partial trip properties to override defaults
 * @returns A Trip object with weather information
 *
 * @example
 * const tripWithWeather = createMockTripWithWeather();
 */
export const createMockTripWithWeather = (overrides: Partial<Trip> = {}): Trip =>
  createMockTrip({
    weatherTemp: '22°C',
    weatherCondition: 'clear',
    weatherForecast: [
      { time: new Date().toISOString(), temperature: 22, precipitation: 0 },
      { time: new Date(Date.now() + 3600000).toISOString(), temperature: 23, precipitation: 0 },
      { time: new Date(Date.now() + 7200000).toISOString(), temperature: 24, precipitation: 10 },
    ],
    ...overrides,
  });
