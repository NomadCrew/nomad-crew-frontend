export type LogModule = 'UI' | 'AUTH' | 'TRIP' | 'LOCATION' | 'CHAT' | 'STORE' | 'API' | 'DEEPLINK' | 'INVITATION' | 'NOTIFICATION';

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