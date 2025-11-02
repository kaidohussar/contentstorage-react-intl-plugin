/**
 * Entry in the memory map that tracks translation metadata
 */
export interface MemoryMapEntry {
  /** Set of message IDs (content IDs) that map to this value */
  ids: Set<string>;
  /** Type of content - always 'text' for translations */
  type: 'text';
  /** Optional metadata for debugging */
  metadata?: {
    /** Language code */
    language?: string;
    /** Timestamp when tracked */
    trackedAt?: number;
  };
}

/**
 * Global memory map for translation tracking
 * Maps translation values to their content IDs
 */
export type MemoryMap = Map<string, MemoryMapEntry>;

/**
 * Window interface extended with Contentstorage properties
 */
export interface ContentstorageWindow extends Window {
  memoryMap?: MemoryMap;
  __contentStorageDebug?: boolean;
}

/**
 * Plugin configuration options for TrackedIntlProvider
 */
export interface TrackedIntlProviderOptions {
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Maximum number of entries in memoryMap
   * When exceeded, oldest entries are removed
   * @default 10000
   */
  maxMemoryMapSize?: number;

  /**
   * Query parameter name for live editor detection
   * @default 'contentstorage_live_editor'
   */
  liveEditorParam?: string;

  /**
   * Allow manual override of live editor mode
   * Useful for testing
   * @default false
   */
  forceLiveMode?: boolean;
}

/**
 * Messages data structure for react-intl
 * Can be a flat or nested object with string values
 */
export type Messages = {
  [key: string]: string | Messages;
};
