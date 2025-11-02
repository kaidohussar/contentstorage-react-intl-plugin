import type { ContentstorageWindow, MemoryMap, MemoryMapEntry } from './types';

/**
 * Checks if the code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Gets the Contentstorage window object with type safety
 */
export function getContentstorageWindow(): ContentstorageWindow | null {
  if (!isBrowser()) return null;
  return window as ContentstorageWindow;
}

/**
 * Detects if the application is running in ContentStorage live editor mode
 *
 * @param liveEditorParam - Query parameter name to check
 * @param forceLiveMode - Force live mode regardless of environment
 * @returns true if in live editor mode
 */
export function detectLiveEditorMode(
  liveEditorParam: string = 'contentstorage_live_editor',
  forceLiveMode: boolean = false
): boolean {
  if (forceLiveMode) return true;
  if (!isBrowser()) return false;

  try {
    const win = getContentstorageWindow();
    if (!win) return false;

    // Check 1: Running in an iframe
    const inIframe = win.self !== win.top;

    // Check 2: URL has the live editor marker
    const urlParams = new URLSearchParams(win.location.search);
    const hasMarker = urlParams.has(liveEditorParam);

    return !!(inIframe && hasMarker);
  } catch (e) {
    // Cross-origin restrictions might block window.top access
    // This is expected when not in live editor mode
    return false;
  }
}

/**
 * Initializes the global memory map if it doesn't exist
 */
export function initializeMemoryMap(): MemoryMap | null {
  const win = getContentstorageWindow();
  if (!win) return null;

  if (!win.memoryMap) {
    win.memoryMap = new Map<string, MemoryMapEntry>();
  }

  return win.memoryMap;
}

/**
 * Load the ContentStorage live editor script
 * This script enables the click-to-edit functionality in the live editor
 */
let liveEditorReadyPromise: Promise<boolean> | null = null;

export function loadLiveEditorScript(
  retries: number = 2,
  delay: number = 3000,
  debug: boolean = false
): Promise<boolean> {
  // Return existing promise if already loading
  if (liveEditorReadyPromise) {
    return liveEditorReadyPromise;
  }

  liveEditorReadyPromise = new Promise<boolean>((resolve) => {
    const win = getContentstorageWindow();
    if (!win) {
      resolve(false);
      return;
    }

    const cdnScriptUrl = 'https://cdn.contentstorage.app/live-editor.js?contentstorage-live-editor=true';

    const loadScript = (attempt: number = 1) => {
      if (debug) {
        console.log(`[ContentStorage] Attempting to load live editor script (attempt ${attempt}/${retries})`);
      }

      const scriptElement = win.document.createElement('script');
      scriptElement.type = 'text/javascript';
      scriptElement.src = cdnScriptUrl;

      scriptElement.onload = () => {
        if (debug) {
          console.log(`[ContentStorage] Live editor script loaded successfully`);
        }
        resolve(true);
      };

      scriptElement.onerror = (error) => {
        // Clean up the failed script element
        scriptElement.remove();

        if (debug) {
          console.error(`[ContentStorage] Failed to load live editor script (attempt ${attempt}/${retries})`, error);
        }

        if (attempt < retries) {
          setTimeout(() => loadScript(attempt + 1), delay);
        } else {
          console.error(`[ContentStorage] All ${retries} attempts to load live editor script failed`);
          resolve(false);
        }
      };

      win.document.head.appendChild(scriptElement);
    };

    loadScript();
  });

  return liveEditorReadyPromise;
}

/**
 * Gets the global memory map
 */
export function getMemoryMap(): MemoryMap | null {
  const win = getContentstorageWindow();
  return win?.memoryMap || null;
}

/**
 * Tracks a translation in the memory map
 *
 * @param translationValue - The actual translated text
 * @param translationKey - The content ID (message ID)
 * @param language - Optional language code
 * @param debug - Enable debug logging
 */
export function trackTranslation(
  translationValue: string,
  translationKey: string,
  language?: string,
  debug: boolean = false
): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap) return;

  // Get or create entry
  const existingEntry = memoryMap.get(translationValue);
  const idSet = existingEntry ? existingEntry.ids : new Set<string>();
  idSet.add(translationKey);

  const entry: MemoryMapEntry = {
    ids: idSet,
    type: 'text',
    metadata: {
      language,
      trackedAt: Date.now(),
    },
  };

  memoryMap.set(translationValue, entry);

  if (debug) {
    console.log('[ContentStorage] Tracked translation:', {
      value: translationValue,
      key: translationKey,
      language,
    });
  }
}

/**
 * Cleans up old entries from memory map when size exceeds limit
 * Removes oldest entries first (based on trackedAt timestamp)
 *
 * @param maxSize - Maximum number of entries to keep
 */
export function cleanupMemoryMap(maxSize: number): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap || memoryMap.size <= maxSize) return;

  // Convert to array with timestamps
  const entries = Array.from(memoryMap.entries()).map(([key, value]) => ({
    key,
    value,
    timestamp: value.metadata?.trackedAt || 0,
  }));

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate how many to remove
  const toRemove = memoryMap.size - maxSize;

  // Remove oldest entries
  for (let i = 0; i < toRemove; i++) {
    memoryMap.delete(entries[i].key);
  }
}

/**
 * Deeply traverses a messages object and extracts all string values with their keys
 *
 * @param obj - Messages object to traverse
 * @param prefix - Current key prefix (for nested objects)
 * @returns Array of [key, value] pairs
 */
export function flattenMessages(
  obj: any,
  prefix: string = ''
): Array<[string, string]> {
  const results: Array<[string, string]> = [];

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      results.push([fullKey, value]);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested objects
      results.push(...flattenMessages(value, fullKey));
    }
  }

  return results;
}

/**
 * Debug helper to log memory map contents
 */
export function debugMemoryMap(): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap) {
    console.log('[ContentStorage] Memory map not initialized');
    return;
  }

  console.log('[ContentStorage] Memory map contents:');
  console.log(`Total entries: ${memoryMap.size}`);

  const entries = Array.from(memoryMap.entries()).slice(0, 10);
  console.table(
    entries.map(([value, entry]) => ({
      value: value.substring(0, 50),
      keys: Array.from(entry.ids).join(', '),
    }))
  );

  if (memoryMap.size > 10) {
    console.log(`... and ${memoryMap.size - 10} more entries`);
  }
}
