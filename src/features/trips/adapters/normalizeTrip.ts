import { Trip } from '../types';
import { logger } from '@/src/utils/logger'; // Assuming logger is available

/**
 * Normalize a backend trip object to the frontend Trip type.
 * Handles member normalization, destination shape, and backend quirks.
 */
export function normalizeTrip(raw: any): Trip {
  logger.info('[normalizeTrip] Input raw trip:', raw); // Log input

  // Normalize members
  const members =
    Array.isArray(raw.members) && raw.members.length > 0
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
  logger.info('[normalizeTrip] Normalized members:', members); // Log members

  // Normalize destination
  const destination = {
    address: raw.destinationAddress || raw.destination?.address || '',
    name: raw.destinationName || raw.destination?.name,
    coordinates:
      raw.destinationLatitude && raw.destinationLongitude
        ? { lat: raw.destinationLatitude, lng: raw.destinationLongitude }
        : raw.destination?.coordinates,
    placeId: raw.destinationPlaceId || raw.destination?.placeId,
  };

  // Normalize status
  let normalizedStatus = raw.status?.toUpperCase();
  if (normalizedStatus === 'PLANNED') {
    normalizedStatus = 'PLANNING';
  }
  logger.info('[normalizeTrip] Raw status:', raw.status, 'Normalized status:', normalizedStatus); // Log status

  // Return normalized Trip
  const finalTrip = {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    destination,
    startDate:
      typeof raw.startDate === 'string' ? raw.startDate : new Date(raw.startDate).toISOString(),
    endDate: typeof raw.endDate === 'string' ? raw.endDate : new Date(raw.endDate).toISOString(),
    status: normalizedStatus as Trip['status'],
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    weatherTemp: raw.weatherTemp,
    weatherCondition: raw.weatherCondition,
    weatherForecast: raw.weatherForecast,
    backgroundImageUrl: raw.backgroundImageUrl,
    isGhostCard: raw.isGhostCard,
    participantCount: raw.participantCount,
    invitations: Array.isArray(raw.invitations) ? raw.invitations : [],
    members,
  };
  logger.info('[normalizeTrip] Final normalized trip:', finalTrip); // Log final object
  return finalTrip;
}
