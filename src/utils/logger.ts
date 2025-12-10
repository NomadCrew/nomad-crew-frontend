export type LogModule =
  // Core modules
  | 'APP'
  | 'API'
  | 'API-CLIENT'
  | 'API Client' // Legacy, should migrate to API-CLIENT
  | 'UI'
  | 'STORE'
  | 'WS'
  // Feature modules
  | 'AUTH'
  | 'AUTH-API'
  | 'AUTH API' // Legacy, should migrate to AUTH-API
  | 'AUTH-SERVICE'
  | 'AUTH SERVICE' // Legacy, should migrate to AUTH-SERVICE
  | 'AUTH-GUARD'
  | 'AUTH-PROVIDER'
  | 'TRIP'
  | 'TRIP-DETAIL'
  | 'Trip Detail Screen' // Legacy, should migrate to TRIP-DETAIL
  | 'CHAT'
  | 'CHAT-SCREEN'
  | 'Chat Screen' // Legacy, should migrate to CHAT-SCREEN
  | 'MOBILE-CHAT-SCREEN'
  | 'Mobile Chat Screen' // Legacy, should migrate to MOBILE-CHAT-SCREEN
  | 'Chat Input' // Legacy, should migrate to CHAT-INPUT
  | 'ChatStore'
  | 'TODO'
  | 'LOCATION'
  | 'LOCATION-SCREEN'
  | 'NOTIFICATION'
  | 'INVITATION'
  | 'INVITE'
  | 'DEEPLINK'
  // Utility modules
  | 'MOCK'
  // Allow any string for backwards compatibility with logger calls that use full sentences
  // TODO: Migrate all logger calls to use proper module identifiers
  | (string & {});

export const logger = {
  debug: (module: LogModule, ...args: unknown[]) => {
    if (__DEV__) {
      console.debug(`[${module}]`, ...args);
    }
  },
  log: (module: LogModule, ...args: unknown[]) => {
    console.log(`[${module}]`, ...args);
  },
  info: (module: LogModule, ...args: unknown[]) => {
    console.info(`[${module}]`, ...args);
  },
  error: (module: LogModule, ...args: unknown[]) => {
    console.error(`[${module}]`, ...args);
  },
  warn: (module: LogModule, ...args: unknown[]) => {
    console.warn(`[${module}]`, ...args);
  },
};
