import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface ConnectionInfo {
  connectionId: string;
  timestamp: number;
  userId: string;
}

export interface PlatformStorage {
  registerConnection(tripId: string, info: ConnectionInfo): Promise<void>;
  unregisterConnection(tripId: string): Promise<void>;
  checkExistingConnection(tripId: string): Promise<ConnectionInfo | null>;
  cleanup(): Promise<void>;
}

class MobileStorage implements PlatformStorage {
  private static PREFIX = '@NomadCrew:websocket:';

  private getKey(tripId: string): string {
    return `${MobileStorage.PREFIX}${tripId}`;
  }

  async registerConnection(tripId: string, info: ConnectionInfo): Promise<void> {
    const key = this.getKey(tripId);
    await AsyncStorage.setItem(key, JSON.stringify(info));
  }

  async unregisterConnection(tripId: string): Promise<void> {
    const key = this.getKey(tripId);
    await AsyncStorage.removeItem(key);
  }

  async checkExistingConnection(tripId: string): Promise<ConnectionInfo | null> {
    const key = this.getKey(tripId);
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async cleanup(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const wsKeys = keys.filter(key => key.startsWith(MobileStorage.PREFIX));
    await AsyncStorage.multiRemove(wsKeys);
  }
}

class WebStorage implements PlatformStorage {
  private channel: BroadcastChannel;
  private static PREFIX = 'nomadcrew_ws_';

  constructor() {
    this.channel = new BroadcastChannel('nomadcrew_websocket');
    this.setupChannelListeners();
  }

  private setupChannelListeners(): void {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'connection_check') {
        // If we have this connection, respond
        const info = this.getLocalConnection(event.data.tripId);
        if (info) {
          this.channel.postMessage({
            type: 'connection_response',
            tripId: event.data.tripId,
            info
          });
        }
      }
    };
  }

  private getKey(tripId: string): string {
    return `${WebStorage.PREFIX}${tripId}`;
  }

  private getLocalConnection(tripId: string): ConnectionInfo | null {
    const value = localStorage.getItem(this.getKey(tripId));
    return value ? JSON.parse(value) : null;
  }

  async registerConnection(tripId: string, info: ConnectionInfo): Promise<void> {
    const key = this.getKey(tripId);
    localStorage.setItem(key, JSON.stringify(info));
    
    // Notify other tabs
    this.channel.postMessage({
      type: 'new_connection',
      tripId,
      info
    });
  }

  async unregisterConnection(tripId: string): Promise<void> {
    const key = this.getKey(tripId);
    localStorage.removeItem(key);
    
    // Notify other tabs
    this.channel.postMessage({
      type: 'connection_closed',
      tripId
    });
  }

  async checkExistingConnection(tripId: string): Promise<ConnectionInfo | null> {
    // First check local storage
    const localInfo = this.getLocalConnection(tripId);
    if (localInfo) return localInfo;

    // Ask other tabs
    return new Promise((resolve) => {
      let responseTimeout: NodeJS.Timeout;
      
      const responseHandler = (event: MessageEvent) => {
        if (event.data.type === 'connection_response' && 
            event.data.tripId === tripId) {
          clearTimeout(responseTimeout);
          this.channel.removeEventListener('message', responseHandler);
          resolve(event.data.info);
        }
      };

      this.channel.addEventListener('message', responseHandler);
      
      // Broadcast check request
      this.channel.postMessage({
        type: 'connection_check',
        tripId
      });

      // Set timeout for response
      responseTimeout = setTimeout(() => {
        this.channel.removeEventListener('message', responseHandler);
        resolve(null);
      }, 1000);
    });
  }

  async cleanup(): Promise<void> {
    // Clear all WebSocket related entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(WebStorage.PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    
    // Notify other tabs
    this.channel.postMessage({ type: 'cleanup' });
  }
}

// Factory function to create appropriate storage
export function createPlatformStorage(): PlatformStorage {
  if (Platform.OS === 'web') {
    return new WebStorage();
  }
  return new MobileStorage();
}
