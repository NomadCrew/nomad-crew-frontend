import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// Optionally, set a maximum number of listeners to avoid warnings.
eventBus.setMaxListeners(50);

export default eventBus;
