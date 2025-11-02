import React, { useMemo } from 'react';
import {
  createIntl,
  createIntlCache,
  RawIntlProvider,
  IntlConfig,
  IntlShape,
} from 'react-intl';
import {
  detectLiveEditorMode,
  initializeMemoryMap,
  trackTranslation,
  loadLiveEditorScript,
  flattenMessages,
  cleanupMemoryMap,
} from './utils';
export interface ContentstorageIntlProviderProps extends IntlConfig {
  children: React.ReactNode;
  debug?: boolean;
  forceLiveMode?: boolean;
  liveEditorParam?: string;
  maxMemoryMapSize?: number;
}

/**
 * ContentstorageIntlProvider - Drop-in replacement for react-intl's IntlProvider
 *
 * Automatically enables Contentstorage live editor tracking when in live mode.
 * Intercepts formatMessage() calls to build a memory map of translations for
 * click-to-edit functionality.
 *
 * @example
 * ```tsx
 * import { ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';
 *
 * function App() {
 *   return (
 *     <ContentstorageIntlProvider locale="en" messages={messages}>
 *       <YourApp />
 *     </ContentstorageIntlProvider>
 *   );
 * }
 * ```
 */
export function ContentstorageIntlProvider({
  children,
  locale,
  messages = {},
  debug = false,
  forceLiveMode = false,
  maxMemoryMapSize = 10000,
  ...intlConfig
}: ContentstorageIntlProviderProps) {

  const trackedIntl = useMemo(() => {
    // Detect live editor mode
    const isLiveMode = detectLiveEditorMode('contentstorage_live_editor', forceLiveMode);

    // Create the base intl object
    const cache = createIntlCache();
    const baseIntl = createIntl(
      {
        locale,
        messages,
        ...intlConfig,
      },
      cache
    );

    // If not in live mode, return base intl unmodified
    if (!isLiveMode) {
      if (debug) {
        console.log('[ContentStorage] Running in normal mode (not live editor)');
      }
      return baseIntl;
    }

    // Live mode initialization
    if (debug) {
      console.log('[ContentStorage] Live editor mode enabled');
    }

    // Initialize memory map
    initializeMemoryMap();

    // Load live editor script
    loadLiveEditorScript(2, 3000, debug).then((loaded) => {
      if (loaded) {
        if (debug) {
          console.log('[ContentStorage] Live editor ready');
        }
      } else {
        console.warn('[ContentStorage] Failed to load live editor script');
      }
    });

    // Track static messages from initial load
    const flatMessages = flattenMessages(messages);
    flatMessages.forEach(([id, value]) => {
      trackTranslation(value, id, locale, debug);
    });

    if (debug) {
      console.log(`[ContentStorage] Tracked ${flatMessages.length} static messages`);
    }

    // Create tracked version of intl object by wrapping formatMessage
    const trackedFormatMessage = (descriptor: any, values?: any, opts?: any) => {
      const result = baseIntl.formatMessage(descriptor, values, opts);

      // Track the final formatted result (only if it's a string)
      if (typeof result === 'string' && descriptor.id) {
        trackTranslation(result, descriptor.id, locale, debug);

        // Cleanup if needed
        if (maxMemoryMapSize) {
          cleanupMemoryMap(maxMemoryMapSize);
        }
      }

      return result;
    };

    const trackedIntl: IntlShape = {
      ...baseIntl,
      formatMessage: trackedFormatMessage as any,
    };

    if (debug) {
      console.log('[ContentStorage] Live editor tracking initialized');
    }

    return trackedIntl;
  }, [locale, messages, debug, forceLiveMode, maxMemoryMapSize, intlConfig]);

  return <RawIntlProvider value={trackedIntl}>{children}</RawIntlProvider>;
}
