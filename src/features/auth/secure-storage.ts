import * as SecureStore from 'expo-secure-store';
import { logger } from '@/src/utils/logger';

/**
 * Maximum byte size for a single expo-secure-store value.
 * expo-secure-store enforces a 2048-byte limit per key.
 */
const CHUNK_LIMIT = 2048;

/**
 * Suffix appended to the original key to store the chunk count metadata.
 */
const CHUNK_COUNT_SUFFIX = '__chunk_count';

/**
 * Returns the key used for a specific chunk index.
 */
function chunkKey(key: string, index: number): string {
  return `${key}__chunk_${index}`;
}

/**
 * Removes all chunks associated with a key from SecureStore.
 */
async function removeChunks(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (countRaw !== null) {
    const count = parseInt(countRaw, 10);
    const deletions: Promise<void>[] = [];

    if (!Number.isInteger(count) || count <= 0) {
      logger.warn(
        'AUTH',
        `SecureStorage: invalid chunk count for key "${key}": ${countRaw}, falling back to scan`
      );
      // Fallback: attempt to delete up to 10 chunk indexes to clean orphans
      // (Auth tokens typically use 2-4 chunks; 10 is a generous safety margin)
      for (let i = 0; i < 10; i++) {
        deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => {}));
      }
    } else {
      for (let i = 0; i < count; i++) {
        deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)));
      }
    }

    deletions.push(SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`));
    await Promise.all(deletions);
  }
}

/**
 * A Supabase-compatible storage adapter backed by expo-secure-store.
 *
 * Because expo-secure-store enforces a 2048-byte limit per key, values that
 * exceed this limit are automatically split into numbered chunks and
 * reassembled on read. A separate metadata key tracks the number of chunks.
 *
 * Implements the Supabase `SupportedStorage` interface:
 *   - getItem(key): Promise<string | null>
 *   - setItem(key, value): Promise<void>
 *   - removeItem(key): Promise<void>
 */
export const secureStorage = {
  /**
   * Retrieves a value from SecureStore. If the value was chunked during
   * storage, the chunks are reassembled into the original string.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // Check if the value is stored as chunks
      const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);

      if (countRaw !== null) {
        // Value was chunked — reassemble
        const count = parseInt(countRaw, 10);
        if (!Number.isInteger(count) || count <= 0) {
          logger.warn('AUTH', `SecureStorage: invalid chunk count for key "${key}": ${countRaw}`);
          return null;
        }
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
          if (chunk === null) {
            logger.warn('AUTH', `SecureStorage: missing chunk ${i} of ${count} for key "${key}"`);
            return null;
          }
          chunks.push(chunk);
        }
        return chunks.join('');
      }

      // Not chunked — try reading the value directly
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('AUTH', `SecureStorage: failed to get item for key "${key}"`, error);
      return null;
    }
  },

  /**
   * Stores a value in SecureStore. If the value exceeds the 2048-byte limit,
   * it is automatically split into chunks stored under numbered keys.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Always clean up any previous chunks first to avoid stale data
      await removeChunks(key);

      if (value.length <= CHUNK_LIMIT) {
        // Fits in a single key — store directly
        await SecureStore.setItemAsync(key, value);
      } else {
        // Split into chunks
        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK_LIMIT) {
          chunks.push(value.slice(i, i + CHUNK_LIMIT));
        }

        // Store all chunks in parallel
        const writes: Promise<void>[] = chunks.map((chunk, index) =>
          SecureStore.setItemAsync(chunkKey(key, index), chunk)
        );
        writes.push(SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks.length)));
        await Promise.all(writes);

        // Remove the non-chunked key if it existed from a previous smaller value
        try {
          await SecureStore.deleteItemAsync(key);
        } catch {
          // Ignore — key may not exist
        }
      }
    } catch (error) {
      logger.error('AUTH', `SecureStorage: failed to set item for key "${key}"`, error);
    }
  },

  /**
   * Removes a value (and any associated chunks) from SecureStore.
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Remove chunks if they exist
      await removeChunks(key);

      // Also remove the non-chunked key
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('AUTH', `SecureStorage: failed to remove item for key "${key}"`, error);
    }
  },
};
