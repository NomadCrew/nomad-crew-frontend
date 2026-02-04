import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Todo UI State Store
 *
 * This store manages UI-specific state for the todos feature.
 * Server state (todos data) is managed by TanStack Query hooks in hooks.ts.
 *
 * MIGRATION NOTE:
 * - All server state management has been moved to TanStack Query (see hooks.ts)
 * - The processedEvents memory leak has been removed
 * - WebSocket events should trigger TanStack Query cache invalidations
 * - This store is kept minimal for UI state only
 */
interface TodoUIState {
  // UI state can be added here as needed
  // Examples:
  // - selectedTodoId: string | null;
  // - filterStatus: 'all' | 'complete' | 'incomplete';
  // - sortBy: 'date' | 'status';
}

export const useTodoStore = create<TodoUIState>()(
  devtools((set, get) => ({}), { name: 'TodoUIStore' })
);
