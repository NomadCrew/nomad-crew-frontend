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
} from '@/src/types/trip';
import { API_PATHS } from '@/src/utils/api-paths';
import { ServerEvent, isTripEvent, isTodoEvent, isWeatherEvent, isMemberInviteEvent, isMemberEvent } from '@/src/types/events';
import { useTodoStore } from '@/src/store/useTodoStore';
import { mapWeatherCode } from '@/src/utils/weather';
import { apiClient } from '@/src/api/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // Core operations
  createTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  // Read operations
  fetchTrips: () => Promise<void>;
  getTripById: (id: string) => Trip | undefined;
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
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

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
    const trip = get().trips.find(trip => trip.id === id);
    
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
        return tripWithCreator;
      }
      
      // Check if creator is already in members list
      const creatorExists = trip.members.some(member => member.userId === trip.createdBy);
      if (!creatorExists) {
        // Try to get creator's user info if available
        const currentUser = useAuthStore.getState().user;
        const creatorName = currentUser && currentUser.id === trip.createdBy
          ? getUserDisplayName(currentUser)
          : undefined;
          
        const tripWithCreator = {
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
        return tripWithCreator;
      }
    }
    
    return trip;
  },

  updateTripStatus: async (id: string, status: TripStatus) => {
    set({ loading: true, error: null });
    try {
      await api.patch<UpdateTripStatusResponse>(
        `${API_PATHS.trips.updateStatus(id)}`,
        { status } as UpdateTripStatusRequest
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

  handleTripEvent: (event: ServerEvent) => {
    if (isWeatherEvent(event)) {
      const weatherForecast: WeatherForecast[] = event.payload.hourly_forecast.map(hour => ({
        time: hour.timestamp,
        temperature: hour.temperature_2m,
        precipitation: hour.precipitation
      }));

      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === event.tripId ? {
            ...trip,
            weatherTemp: `${Math.round(event.payload.temperature_2m)}°C`,
            weatherCondition: mapWeatherCode(event.payload.weather_code),
            weatherForecast,
            lastUpdated: event.payload.timestamp
          } as Trip : trip
        )
      }));
    } else if (isTripEvent(event)) {
      set(state => ({
        trips: state.trips.map(trip =>
          trip.id === event.tripId ? {
            ...trip,
            name: event.payload.name,
            description: event.payload.description,
            startDate: event.payload.startDate ?? trip.startDate,
            endDate: event.payload.endDate ?? trip.endDate,
            status: event.payload.status as TripStatus
          } as Trip : trip
        )
      }));
    } else if (isTodoEvent(event)) {
      useTodoStore.getState().handleTodoEvent(event);
    } else if (isMemberInviteEvent(event)) {
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === event.tripId ? {
            ...trip,
            invitations: [
              ...(trip.invitations || []), 
              {
                email: event.payload.inviteeEmail,
                status: 'pending',
                token: event.payload.invitationToken,
                expiresAt: event.payload.expiresAt
              }
            ]
          } as Trip : trip
        )
      }));
    } else if (isMemberEvent(event)) {
      if (event.type === 'MEMBER_ADDED') {
        // Try to get user info if it's the current user
        const currentUser = useAuthStore.getState().user;
        const isCurrentUser = currentUser && currentUser.id === event.payload.userId;
        const memberName = isCurrentUser
          ? getUserDisplayName(currentUser)
          : event.payload.userId ? `Member ${event.payload.userId.substring(0, 4)}` : 'New Member'; // Use a fallback name since payload doesn't have name
          
        set(state => ({
          trips: state.trips.map(trip => 
            trip.id === event.tripId ? {
              ...trip,
              members: [
                ...(trip.members || []),
                {
                  userId: event.payload.userId!,
                  name: memberName,
                  role: (event.payload.role || 'member') as 'owner' | 'admin' | 'member',
                  joinedAt: new Date().toISOString()
                }
              ]
            } as Trip : trip
          )
        }));
      } else if (event.type === 'MEMBER_ROLE_UPDATED') {
        set(state => ({
          trips: state.trips.map(trip => 
            trip.id === event.tripId ? {
              ...trip,
              members: trip.members?.map(member => 
                member.userId === event.payload.userId 
                  ? { ...member, role: event.payload.role as 'owner' | 'admin' | 'member' } 
                  : member
              ) || []
            } as Trip : trip
          )
        }));
      } else if (event.type === 'MEMBER_REMOVED') {
        set(state => ({
          trips: state.trips.map(trip => 
            trip.id === event.tripId ? {
              ...trip,
              members: trip.members?.filter(member => member.userId !== event.payload.userId) || []
            } as Trip : trip
          )
        }));
      }
    }
  },

  inviteMember: async (tripId: string, email: string, role: 'owner' | 'admin' | 'member') => {
    try {
      // Default to 'member' role if not specified
      const memberRole = role || 'member';
      await api.post(API_PATHS.trips.invite(tripId), {
        email,
        role: memberRole.toUpperCase()
      });
    } catch (error) {
      throw new Error('Failed to send invitation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  revokeInvitation: async (tripId: string, invitationId: string) => {
    try {
      await api.delete(`${API_PATHS.trips.invitations(tripId)}/${invitationId}`);
      
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? {
            ...trip,
            invitations: trip.invitations?.filter(inv => inv.token !== invitationId) || []
          } as Trip : trip
        )
      }));
    } catch (error) {
      throw new Error('Failed to revoke invitation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  updateMemberRole: async (tripId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
    try {
      await api.patch(`${API_PATHS.trips.byId(tripId)}/members/${userId}`, {
        role: role.toUpperCase()
      });
      
      // Optimistically update the UI
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? {
            ...trip,
            members: trip.members?.map(member => 
              member.userId === userId ? { ...member, role } : member
            ) || []
          } as Trip : trip
        )
      }));
    } catch (error) {
      throw new Error('Failed to update member role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  removeMember: async (tripId: string, userId: string) => {
    try {
      await api.delete(`${API_PATHS.trips.byId(tripId)}/members/${userId}`);
      
      // Optimistically update the UI
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? {
            ...trip,
            members: trip.members?.filter(member => member.userId !== userId) || []
          } as Trip : trip
        )
      }));
    } catch (error) {
      throw new Error('Failed to remove member: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  acceptInvitation: async (token: string) => {
    try {
      const response = await apiClient.getAxiosInstance().post(API_PATHS.trips.acceptInvitation, {
        token
      });
      
      const currentUser = useAuthStore.getState().user;
      
      if (response.data.trip && currentUser) {
        // Make sure the user is added to the members list
        const tripWithMember = {
          ...response.data.trip,
          members: [
            ...(response.data.trip.members || []),
            // Only add the current user if they're not already in the members list
            ...(!response.data.trip.members?.some((m: { userId: string }) => m.userId === currentUser.id) 
              ? [{
                  userId: currentUser.id,
                  name: getUserDisplayName(currentUser),
                  role: 'member' as 'owner' | 'admin' | 'member', // Default role for invited members
                  joinedAt: new Date().toISOString()
                }] 
              : [])
          ]
        } as Trip;
        
        set(state => ({
          trips: [...state.trips, tripWithMember]
        }));
      }
      await AsyncStorage.removeItem('pendingInvitation');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkPendingInvitations: async () => {
    const token = await AsyncStorage.getItem('pendingInvitation');
    if (token && useAuthStore.getState().user) {
      get().acceptInvitation(token);
    }
  }
}));

// Helper function to get the best available display name for a user
function getUserDisplayName(user: any): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.lastName) {
    return user.lastName;
  } else if (user.username && user.username.trim() !== '') {
    return user.username;
  } else if (user.email) {
    // Extract name from email (e.g., john.doe@example.com -> John Doe)
    const emailName = user.email.split('@')[0];
    if (emailName.includes('.')) {
      return emailName.split('.')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    } else if (emailName.includes('_')) {
      return emailName.split('_')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    // Just capitalize the email name if no separator
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  // Fallback to a generic name
  return 'Trip Member';
}