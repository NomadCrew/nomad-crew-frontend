type LogModule = 'API' | 'WS' | 'AUTH' | 'TRIP' | 'TODO' | 'WEATHER' | 'UI';

export const logger = {
  debug: (module: LogModule, ...args: unknown[]) => {
    if (__DEV__) {
      console.debug(`[${module}]`, ...args);
    }
  },
  error: (module: LogModule, ...args: unknown[]) => {
    console.error(`[${module}]`, ...args);
  },
  warn: (module: LogModule, ...args: unknown[]) => {
    console.warn(`[${module}]`, ...args);
  }
}; 