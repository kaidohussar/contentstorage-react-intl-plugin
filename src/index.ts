/**
 * @contentstorage/react-intl-plugin
 *
 * react-intl plugin for Contentstorage live editor translation tracking
 */

export { ContentstorageIntlProvider } from './provider';
export { debugMemoryMap } from './utils';
export type {
  ContentstorageIntlProviderProps,
} from './provider';
export type {
  MemoryMap,
  MemoryMapEntry,
  ContentstorageWindow,
  Messages,
  TrackedIntlProviderOptions,
} from './types';

// Re-export all react-intl exports for convenience
export * from 'react-intl';
