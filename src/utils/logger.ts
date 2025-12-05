export type LogModule = 
  | 'UI' 
  | 'AUTH' 
  | 'TRIP' 
  | 'LOCATION' 
  | 'CHAT' 
  | 'STORE' 
  | 'API' 
  | 'DEEPLINK' 
  | 'INVITATION' 
  | 'NOTIFICATION' 
  | 'ChatStore' 
  | 'location'
  | 'todo'
  | 'chat'
  | 'Chat Input'
  | 'Generating mock member locations around' 
  | 'Generated mock locations:' 
  | 'Setting location sharing enabled:' 
  | 'Failed to save location sharing preference' 
  | 'Not starting location tracking because sharing is disabled' 
  | 'Already tracking location, not starting again' 
  | 'Starting location tracking for trip:' 
  | 'Location permission not granted:' 
  | 'Location update received:' 
  | 'Location tracking started successfully' 
  | 'Failed to start location tracking:' 
  | 'Stopping location tracking' 
  | 'No user found, not updating location' 
  | 'MOCK' 
  | 'Failed to update location' 
  | 'Getting member locations for trip:' 
  | 'Location sharing disabled, not fetching member locations' 
  | 'Using current location for mock data:' 
  | 'No current location, using default coordinates for mock data' 
  | 'Making API call to get member locations' 
  | 'Received member locations:' 
  | 'Failed to get member locations' 
  | 'Loaded location sharing preference from storage:' 
  | 'Failed to load location sharing preference' 
  | 'Failed to save notifications' 
  | 'Failed to mark notification as read' 
  | 'Failed to mark all notifications as read' 
  | 'Failed to clear notifications' 
  | 'Failed to accept trip invite' 
  | 'Failed to decline trip invite' 
  | 'Failed to fetch notifications' 
  | 'Chat Screen' 
  | 'Mobile Chat Screen' 
  | 'API Client' 
  | 'AUTH API'
  | 'useChatMessages'
  | 'useLocations'
  | 'usePresence'
  | 'useReactions'
  | 'useReadReceipts'

  | 'APP'
  | 'INVITE'
  | 'ONBOARDING'
  | 'TripDetailScreen'
  | 'ChatScreen'
  | 'LocationScreen'
  | 'GroupLiveMap';

export const logger = {
  debug: (module: LogModule, ...args: unknown[]) => {
    if (__DEV__) {
      console.debug(`[${module}]`, ...args);
    }
  },
  log: (module: LogModule, ...args: unknown[]) => {
    console.log(`[${module}]`, ...args);
  },
  info: (module: LogModule | string, ...args: unknown[]) => {
    console.info(`[${module}]`, ...args);
  },
  error: (module: LogModule, ...args: unknown[]) => {
    console.error(`[${module}]`, ...args);
  },
  warn: (module: LogModule, ...args: unknown[]) => {
    console.warn(`[${module}]`, ...args);
  }
}; 