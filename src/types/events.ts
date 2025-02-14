import { Trip } from './trip';
import { Todo } from './todo';

// Base Event Types
export type EventType = 
  | 'TRIP_UPDATED' 
  | 'TODO_CREATED' 
  | 'TODO_UPDATED' 
  | 'TODO_DELETED'
  | 'WEATHER_UPDATED'
  | 'USER_MESSAGE'
  | 'CONNECT'
  | 'DISCONNECT'
  | 'ERROR'
  | 'PONG';

// Base Event Interface matching backend
export interface BaseEvent<T = unknown> {
  id: string;
  type: EventType;
  payload: T;
  timestamp: string;
}

// Trip Events
export interface TripUpdatedEvent extends BaseEvent<Trip> {
  type: 'TRIP_UPDATED';
}

// Todo Events
export interface TodoCreatedEvent extends BaseEvent<Todo> {
  type: 'TODO_CREATED';
}

export interface TodoUpdatedEvent extends BaseEvent<Todo> {
  type: 'TODO_UPDATED';
}

export interface TodoDeletedEvent extends BaseEvent<{ id: string }> {
  type: 'TODO_DELETED';
}

// User Message Event
export interface UserMessageEvent extends BaseEvent<{ message: string }> {
  type: 'USER_MESSAGE';
}

// Connection Events
export interface ConnectEvent extends BaseEvent<null> {
  type: 'CONNECT';
}

export interface DisconnectEvent extends BaseEvent<null> {
  type: 'DISCONNECT';
}

// Error Event
export interface ErrorEvent extends BaseEvent<{ code: number; message: string }> {
  type: 'ERROR';
}

// Union type of all possible events
export type WebSocketEvent =
  | TripUpdatedEvent
  | TodoCreatedEvent
  | TodoUpdatedEvent
  | TodoDeletedEvent
  | WeatherUpdatedEvent
  | UserMessageEvent
  | ConnectEvent
  | DisconnectEvent
  | ErrorEvent
  | { type: 'PONG' };

// Type guard functions
export const isWebSocketEvent = (event: unknown): event is WebSocketEvent => {
  if (!event || typeof event !== 'object') return false;
  
  const evt = event as BaseEvent;
  return (
    typeof evt.id === 'string' &&
    typeof evt.type === 'string' &&
    typeof evt.timestamp === 'string' &&
    evt.payload !== undefined
  );
};

export const isTripEvent = (event: WebSocketEvent): event is TripUpdatedEvent | WeatherUpdatedEvent => {
  return event.type === 'TRIP_UPDATED' || event.type === 'WEATHER_UPDATED';
};

export const isTodoEvent = (event: WebSocketEvent): event is TodoCreatedEvent | TodoUpdatedEvent | TodoDeletedEvent => {
  return ['TODO_CREATED', 'TODO_UPDATED', 'TODO_DELETED'].includes(event.type);
};

export interface WeatherUpdatedEvent extends BaseEvent<{
  tripId: string;
  temperature_2m: number;
  weather_code: number;
}> {
  type: 'WEATHER_UPDATED';
}

// WebSocket Connection States
export type WebSocketConnectionState = {
  status: WebSocketStatus;
  instance?: WebSocket | null;
  error?: string;
  lastEventId?: string;
  reconnectAttempt: number;
  lastPongTimestamp?: number;
};

export type WebSocketStatus = 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DISCONNECTED'
  | 'CLOSING'
  | 'RECONNECTING'
  | 'ERROR'
  | 'DUPLICATE_CONNECTION';

// WebSocket Configuration
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
  pongTimeout?: number;
}

// WebSocket Message Queue Item
export interface WebSocketQueueItem {
  id: string;
  message: UserMessageEvent;
  timestamp: number;
  retries: number;
}