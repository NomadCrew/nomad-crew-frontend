import { Trip } from '../types';

/**
 * Normalize a backend trip object to the frontend Trip type.
 * Handles member normalization, destination shape, and backend quirks.
 */
export function normalizeTrip(raw: any): Trip {
  // Normalize members
  const members = Array.isArray(raw.members) && raw.members.length > 0
    ? raw.members.map((member: any) => ({
        userId: member.userId,
        name: member.name,
        role: (member.role || 'member').toLowerCase(),
        joinedAt: member.createdAt || new Date().toISOString(),
      }))
    : [
        {
          userId: raw.createdBy,
          name: raw.createdByName || undefined,
          role: 'owner',
          joinedAt: raw.createdAt,
        },
      ];

  // Normalize destination
  const destination = {
    address: raw.destinationAddress || raw.destination?.address || '',
    coordinates: raw.destinationLatitude && raw.destinationLongitude
      ? { lat: raw.destinationLatitude, lng: raw.destinationLongitude }
      : raw.destination?.coordinates,
    placeId: raw.destinationPlaceId || raw.destination?.placeId,
  };

  // Return normalized Trip
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    destination,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : new Date(raw.startDate).toISOString(),
    endDate: typeof raw.endDate === 'string' ? raw.endDate : new Date(raw.endDate).toISOString(),
    status: raw.status,
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    weatherTemp: raw.weatherTemp,
    weatherCondition: raw.weatherCondition,
    weatherForecast: raw.weatherForecast,
    backgroundImageUrl: raw.backgroundImageUrl,
    isGhostCard: raw.isGhostCard,
    participantCount: raw.participantCount,
    invitations: raw.invitations,
    members,
  };
} 