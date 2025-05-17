import { create } from 'zustand';
import { api } from '@/src/api/api-client';
import {
  Trip,
  CreateTripInput,
  UpdateTripInput,
  TripStatus,
  UpdateTripStatusRequest,
  UpdateTripStatusResponse,
  WeatherForecast,
} from './types'; // Updated import path
import { API_PATHS } from '@/src/utils/api-paths';
import { ServerEvent, isTripEvent, isTodoEvent, isWeatherEvent, isMemberInviteEvent, isMemberEvent } from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';
import { mapWeatherCode } from '@/src/utils/weather';
import { apiClient } from '@/src/api/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/features/auth/store';
import { logger } from '@/src/utils/logger';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  selectedTrip: Trip | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
  setSelectedTrip: (trip: Trip | null) => void;
  // Member operations
  inviteMember: (tripId: string, email: string, role: 'owner' | 'admin' | 'member') => Promise<void>;
  revokeInvitation: (tripId: string, invitationId: string) => Promise<void>;
  updateMemberRole: (tripId: string, userId: string, role: 'owner' | 'admin' | 'member') => Promise<void>;
  removeMember: (tripId: string, userId: string) => Promise<void>;
  // Status operations
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  // WebSocket operations
  handleTripEvent: (event: ServerEvent) => void;
  acceptInvitation: (token: string) => Promise<void>;
  checkPendingInvitations: () => Promise<void>;
  persistInvitation: (token: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,
  selectedTrip: null,

  setSelectedTrip: (trip: Trip | null) => {
    set({ selectedTrip: trip });
  },

  createTrip: async (tripData: CreateTripInput) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error('User must be logged in to create a trip');
      }

      const response = await api.post<Trip>(API_PATHS.trips.create, {
        ...tripData,
        destination: {
          address: tripData.destination.address,
          coordinates: tripData.destination.coordinates,
          placeId: tripData.destination.placeId
        },
        status: 'PLANNING' as TripStatus,
      });
      
      // Get the best available name for the user
      const userName = getUserDisplayName(currentUser);
      
      // Ensure the trip has the creator as a member with owner role
      const tripWithOwner = {
        ...response.data,
        members: [
          {
            userId: currentUser.id,
            name: userName,
            role: 'owner' as 'owner' | 'admin' | 'member',
            joinedAt: new Date().toISOString()
          }
        ]
      } as Trip;
      
      set(state => ({
        trips: [...state.trips, tripWithOwner],
        loading: false,
      }));
      return tripWithOwner;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trip';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTrip: async (id, input) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<Trip>(`${API_PATHS.trips.byId(id)}`, input);
      const updatedTrip = response.data;
      set(state => ({
        trips: state.trips.map(trip => trip.id === id ? updatedTrip : trip),
        loading: false,
      }));
      return updatedTrip;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Trip[]>(API_PATHS.trips.list);
      const currentUser = useAuthStore.getState().user;
      
      // Ensure each trip has at least the creator as a member with owner role
      const tripsWithMembers = response.data.map(trip => {
        if (!trip.members || trip.members.length === 0) {
          // Get creator name if it's the current user
          const creatorName = currentUser && currentUser.id === trip.createdBy
            ? getUserDisplayName(currentUser)
            : undefined;
            
          return {
            ...trip,
            members: [
              {
                userId: trip.createdBy,
                name: creatorName,
                role: 'owner' as 'owner' | 'admin' | 'member',
                joinedAt: trip.createdAt
              }
            ]
          } as Trip;
        }
        
        // Check if creator is already in members list
        const creatorExists = trip.members.some(member => member.userId === trip.createdBy);
        if (!creatorExists) {
          // Get creator name if it's the current user
          const creatorName = currentUser && currentUser.id === trip.createdBy
            ? getUserDisplayName(currentUser)
            : undefined;
            
          return {
            ...trip,
            members: [
              ...trip.members,
              {
                userId: trip.createdBy,
                name: creatorName,
                role: 'owner' as 'owner' | 'admin' | 'member',
                joinedAt: trip.createdAt
              }
            ]
          } as Trip;
        }
        
        // Make sure all members have names
        if (trip.members) {
          const updatedMembers = trip.members.map(member => {
            // If member is current user and doesn't have a name, add it
            if (currentUser && member.userId === currentUser.id && !member.name) {
              return {
                ...member,
                name: getUserDisplayName(currentUser)
              };
            }
            // For other members without names, add a placeholder
            if (!member.name) {
              return {
                ...member,
                name: `Member ${member.userId.substring(0, 4)}`
              };
            }
            return member;
          });
          
          return {
            ...trip,
            members: updatedMembers
          } as Trip;
        }
        
        return trip;
      });
      
      set({ 
        trips: tripsWithMembers || [] as Trip[],
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trips';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteTrip: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`${API_PATHS.trips.byId(id)}`);
      set(state => ({
        trips: state.trips.filter(trip => trip.id !== id),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete trip';
      set({ error: message, loading: false });
      throw error;
    }
  },

  getTripById: (id) => {
    const trip = get().trips.find(t => t.id === id); // Corrected variable name
    
    if (trip) {
      // Ensure the trip has members and the creator is included
      if (!trip.members || trip.members.length === 0) {
        // Try to get creator's user info if available
        const currentUser = useAuthStore.getState().user;
        const creatorName = currentUser && currentUser.id === trip.createdBy
          ? getUserDisplayName(currentUser)
          : undefined;
          
        const tripWithCreator = {
          ...trip,
          members: [
            {
              userId: trip.createdBy,
              name: creatorName,
              role: 'owner' as 'owner' | 'admin' | 'member',
              joinedAt: trip.createdAt
            }
          ]
        } as Trip;
        set(state => ({ // Update the store if we modified the trip
            trips: state.trips.map(t => t.id === id ? tripWithCreator : t),
            selectedTrip: state.selectedTrip?.id === id ? tripWithCreator : state.selectedTrip,
        }));
        return tripWithCreator;
      }
      
      // Check if creator is already in members list
      const creatorExists = trip.members.some(member => member.userId === trip.createdBy);
      if (!creatorExists) {
        const currentUser = useAuthStore.getState().user;
        const creatorName = currentUser && currentUser.id === trip.createdBy
          ? getUserDisplayName(currentUser)
          : undefined;
        const tripWithAddedCreator = {
          ...trip,
          members: [
            ...(trip.members || []), // handle case where members might be undefined initially
            {
              userId: trip.createdBy,
              name: creatorName,
              role: 'owner' as 'owner' | 'admin' | 'member',
              joinedAt: trip.createdAt
            }
          ]
        } as Trip;
        set(state => ({ // Update the store
            trips: state.trips.map(t => t.id === id ? tripWithAddedCreator : t),
            selectedTrip: state.selectedTrip?.id === id ? tripWithAddedCreator : state.selectedTrip,
        }));
        return tripWithAddedCreator;
      }

      // Ensure all members have names
      let membersUpdated = false;
      const updatedMembers = (trip.members || []).map(member => {
        let newName = member.name;
        if (!member.name) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser && member.userId === currentUser.id) {
                newName = getUserDisplayName(currentUser);
            } else {
                newName = `Member ${member.userId.substring(0, 4)}`;
            }
            if (newName !== member.name) membersUpdated = true;
        }
        return { ...member, name: newName };
      });

      if (membersUpdated) {
          const tripWithUpdatedMembers = { ...trip, members: updatedMembers } as Trip;
          set(state => ({ // Update the store
            trips: state.trips.map(t => t.id === id ? tripWithUpdatedMembers : t),
            selectedTrip: state.selectedTrip?.id === id ? tripWithUpdatedMembers : state.selectedTrip,
        }));
        return tripWithUpdatedMembers;
      }

    }
    return trip;
  },


  updateTripStatus: async (id: string, status: TripStatus) => {
    set({ loading: true, error: null });
    try {
      const requestBody: UpdateTripStatusRequest = { status };
      await api.patch<UpdateTripStatusResponse>(
        API_PATHS.trips.updateStatus(id),
        requestBody
      );
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === id ? { ...trip, status } : trip
        ),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip status';
      set({ error: message, loading: false });
      throw error;
    }
  },

  inviteMember: async (tripId: string, email: string, role: 'owner' | 'admin' | 'member') => {
    set({ loading: true, error: null });
    try {
      await api.post(API_PATHS.trips.invite(tripId), { email, role });
      // Optionally, refetch trip data or update locally if the API returns the updated trip
      // For now, we assume a WebSocket event will update the trip details with new invitation
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member';
      logger.error('Invite Member Error:', { tripId, email, role, error: message });
      set({ error: message, loading: false });
      throw error;
    }
  },

  revokeInvitation: async (tripId: string, invitationId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(API_PATHS.trips.revokeInvitation(tripId, invitationId));
      // Update local state by removing the invitation
      set(state => {
        const trip = state.trips.find(t => t.id === tripId);
        if (trip && trip.invitations) {
          const updatedInvitations = trip.invitations.filter(inv => inv.token !== invitationId); // Assuming token is unique id for invitation
          const updatedTrip = { ...trip, invitations: updatedInvitations };
          return {
            trips: state.trips.map(t => (t.id === tripId ? updatedTrip : t)),
            selectedTrip: state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip,
            loading: false,
          };
        }
        return { loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke invitation';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateMemberRole: async (tripId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
    set({ loading: true, error: null });
    try {
      await api.patch(API_PATHS.trips.updateMemberRole(tripId, userId), { role });
      // Assume WebSocket event will update, or refetch trip
      set(state => {
        const trip = state.trips.find(t => t.id === tripId);
        if (trip && trip.members) {
          const updatedMembers = trip.members.map(member => 
            member.userId === userId ? { ...member, role } : member
          );
          const updatedTrip = { ...trip, members: updatedMembers };
          return {
            trips: state.trips.map(t => (t.id === tripId ? updatedTrip : t)),
            selectedTrip: state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip,
            loading: false,
          };
        }
        return { loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member role';
      set({ error: message, loading: false });
      throw error;
    }
  },

  removeMember: async (tripId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(API_PATHS.trips.removeMember(tripId, userId));
      // Assume WebSocket event will update, or refetch trip
      set(state => {
        const trip = state.trips.find(t => t.id === tripId);
        if (trip && trip.members) {
          const updatedMembers = trip.members.filter(member => member.userId !== userId);
          const updatedTrip = { ...trip, members: updatedMembers };
          return {
            trips: state.trips.map(t => (t.id === tripId ? updatedTrip : t)),
            selectedTrip: state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip,
            loading: false,
          };
        }
        return { loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      set({ error: message, loading: false });
      throw error;
    }
  },
  
  acceptInvitation: async (token: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(API_PATHS.invitations.accept(token));
      // Remove the persisted token after successful acceptance
      await AsyncStorage.removeItem(`pendingInvitation_${token}`);
      // Refetch trips to get the updated list including the newly joined trip
      get().fetchTrips(); 
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      logger.error('Accept Invitation Error:', { token, error: message });
      set({ error: message, loading: false });
      // Potentially remove token if it's invalid (e.g., 404 or 410 error)
      if (error.response && (error.response.status === 404 || error.response.status === 410)) {
        await AsyncStorage.removeItem(`pendingInvitation_${token}`);
        logger.info('Removed invalid pending invitation token:', token);
      }
      throw error;
    }
  },

  persistInvitation: async (token: string) => {
    try {
      await AsyncStorage.setItem(`pendingInvitation_${token}`, token);
      logger.info('Persisted invitation token:', token);
    } catch (error) {
      logger.error('Failed to persist invitation token:', { token, error });
    }
  },
  
  checkPendingInvitations: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const invitationKeys = keys.filter(key => key.startsWith('pendingInvitation_'));
      if (invitationKeys.length > 0) {
        logger.info('Found pending invitations:', invitationKeys);
        for (const key of invitationKeys) {
          const token = await AsyncStorage.getItem(key);
          if (token) {
            try {
              logger.info('Attempting to accept pending invitation:', token);
              await get().acceptInvitation(token); 
            } catch (error) {
              logger.warn('Failed to automatically accept pending invitation:', { token, error });
              // Keep token if it failed for reasons other than invalid/expired
            }
          }
        }
      } else {
        logger.info('No pending invitations found.');
      }
    } catch (error) {
      logger.error('Error checking pending invitations:', error);
    }
  },

  handleTripEvent: (event: ServerEvent) => {
    if (isTripEvent(event)) {
      set(state => {
        let newTrips = [...state.trips];
        let newSelectedTrip = state.selectedTrip ? { ...state.selectedTrip } : null;

        switch (event.action) {
          case 'TRIP_CREATED':
            // Avoid duplicate if already added via API response
            if (!newTrips.find(t => t.id === event.payload.id)) {
              newTrips.push(event.payload);
            }
            break;
          case 'TRIP_UPDATED':
            newTrips = newTrips.map(trip =>
              trip.id === event.payload.id ? { ...trip, ...event.payload } : trip
            );
            if (newSelectedTrip && newSelectedTrip.id === event.payload.id) {
              newSelectedTrip = { ...newSelectedTrip, ...event.payload };
            }
            break;
          case 'TRIP_DELETED':
            newTrips = newTrips.filter(trip => trip.id !== event.payload.id);
            if (newSelectedTrip && newSelectedTrip.id === event.payload.id) {
              newSelectedTrip = null;
            }
            break;
           case 'TRIP_STATUS_UPDATED':
            newTrips = newTrips.map(trip =>
              trip.id === event.payload.tripId 
                ? { ...trip, status: event.payload.status } 
                : trip
            );
            if (newSelectedTrip && newSelectedTrip.id === event.payload.tripId) {
              newSelectedTrip = { ...newSelectedTrip, status: event.payload.status };
            }
            break;
        }
        return { trips: newTrips, selectedTrip: newSelectedTrip };
      });
    } else if (isTodoEvent(event)) {
        useTodoStore.getState().handleTodoEvent(event);
    } else if (isWeatherEvent(event)) {
        set(state => {
            const tripId = event.payload.tripId;
            const newTrips = state.trips.map(trip => {
                if (trip.id === tripId) {
                    const updatedTrip = { ...trip };
                    if (event.payload.current) {
                        updatedTrip.weatherTemp = `${Math.round(event.payload.current.temp_c)}°C`;
                        updatedTrip.weatherCondition = mapWeatherCode(event.payload.current.condition.code);
                    }
                    if (event.payload.forecast && event.payload.forecast.forecastday && event.payload.forecast.forecastday.length > 0) {
                        updatedTrip.weatherForecast = event.payload.forecast.forecastday[0].hour.map((h: any): WeatherForecast => ({
                            time: h.time.split(' ')[1],
                            temperature: Math.round(h.temp_c),
                            precipitation: h.precip_mm > 0 ? Math.round(h.precip_mm * 10) / 10 : 0, // round to 1 decimal
                        })).filter((_:any, index:number) => index % 3 === 0); // every 3 hours
                    }
                    return updatedTrip;
                }
                return trip;
            });
            const newSelectedTrip = state.selectedTrip && state.selectedTrip.id === tripId
                ? newTrips.find(t => t.id === tripId) || state.selectedTrip
                : state.selectedTrip;

            return { trips: newTrips, selectedTrip: newSelectedTrip };
        });
    } else if (isMemberInviteEvent(event)) {
        set(state => {
            const { tripId, invitation, action } = event.payload;
            const tripIndex = state.trips.findIndex(t => t.id === tripId);
            if (tripIndex === -1) return state;

            const updatedTrip = { ...state.trips[tripIndex] };
            let currentInvitations = updatedTrip.invitations ? [...updatedTrip.invitations] : [];

            if (action === 'INVITATION_SENT' || action === 'INVITATION_UPDATED') {
                const existingInviteIndex = currentInvitations.findIndex(inv => inv.token === invitation.token); // Assuming token is unique id
                if (existingInviteIndex !== -1) {
                    currentInvitations[existingInviteIndex] = invitation;
                } else {
                    currentInvitations.push(invitation);
                }
            } else if (action === 'INVITATION_REVOKED') {
                currentInvitations = currentInvitations.filter(inv => inv.token !== invitation.token);
            }
             else if (action === 'INVITATION_ACCEPTED') {
                // Remove from invitations, member list will be updated by MEMBER_JOINED
                currentInvitations = currentInvitations.filter(inv => inv.token !== invitation.token);
            }


            updatedTrip.invitations = currentInvitations;
            const newTrips = [...state.trips];
            newTrips[tripIndex] = updatedTrip;

            const newSelectedTrip = state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip;

            return { trips: newTrips, selectedTrip: newSelectedTrip };
        });
    } else if (isMemberEvent(event)) {
        set(state => {
            const { tripId, member, action } = event.payload;
            const tripIndex = state.trips.findIndex(t => t.id === tripId);
            if (tripIndex === -1) return state; // Trip not found

            const updatedTrip = { ...state.trips[tripIndex] };
            let currentMembers = updatedTrip.members ? [...updatedTrip.members] : [];

            if (action === 'MEMBER_JOINED' || action === 'MEMBER_UPDATED') {
                const existingMemberIndex = currentMembers.findIndex(m => m.userId === member.userId);
                if (existingMemberIndex !== -1) {
                    currentMembers[existingMemberIndex] = { ...currentMembers[existingMemberIndex], ...member };
                } else {
                    currentMembers.push(member);
                }
                 // Also ensure participantCount is updated
                updatedTrip.participantCount = currentMembers.length;

            } else if (action === 'MEMBER_LEFT' || action === 'MEMBER_REMOVED') {
                currentMembers = currentMembers.filter(m => m.userId !== member.userId);
                 // Also ensure participantCount is updated
                updatedTrip.participantCount = currentMembers.length;
            }
            
            updatedTrip.members = currentMembers;
            const newTrips = [...state.trips];
            newTrips[tripIndex] = updatedTrip;

            const newSelectedTrip = state.selectedTrip?.id === tripId ? updatedTrip : state.selectedTrip;
            
            return { trips: newTrips, selectedTrip: newSelectedTrip };
        });
    }
  },
}));

// Helper function to get a display name for the user
// TODO: This should be moved to a more appropriate utility file or user service
// and potentially use a more robust way to get user's name (e.g., from profile)
function getUserDisplayName(user: any): string {
  if (!user) return 'Unknown User';
  // Try to get name from user_metadata, then raw_user_meta_data, then email
  const name = user.user_metadata?.full_name || 
               user.user_metadata?.name ||
               user.raw_user_meta_data?.full_name ||
               user.raw_user_meta_data?.name;
  
  if (name) return name;
  
  if (user.email) {
    return user.email.split('@')[0]; // Fallback to part of email
  }
  
  return `User ${user.id?.substring(0, 4) || ''}`; // Fallback to part of ID
} 