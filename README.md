# Contentstorage React-Intl Plugin

Official react-intl plugin for [Contentstorage](https://contentstorage.app) live editor translation tracking.

## Features

- **Live Editor Integration** - Automatically detects and enables tracking when running in Contentstorage live editor
- **Translation Tracking** - Maps translation values to their message IDs for click-to-edit functionality
- **Zero Production Overhead** - Tracking only activates in live editor mode
- **TypeScript Support** - Full type definitions included
- **Memory Management** - Automatic cleanup of old entries to prevent memory leaks
- **Drop-in Replacement** - Simply replace `IntlProvider` with `ContentstorageIntlProvider`

## Installation

```bash
npm install @contentstorage/react-intl-plugin
```

## Quick Start

### Basic Usage

Replace react-intl's `IntlProvider` with `ContentstorageIntlProvider`:

```tsx
import { ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';

function App() {
  const messages = {
    welcome: 'Welcome to our site',
    greeting: 'Hello {name}!',
  };

  return (
    <ContentstorageIntlProvider locale="en" messages={messages}>
      <YourApp />
    </ContentstorageIntlProvider>
  );
}
```

**That's it!** Live editor tracking is now enabled when in live editor mode.

## How It Works

### Live Editor Detection

The plugin automatically detects when your app is running in the Contentstorage live editor by checking:

1. The app is running in an iframe (`window.self !== window.top`)
2. The URL contains the query parameter `?contentstorage_live_editor=true`

Both conditions must be true for tracking to activate.

### Translation Tracking

When in live editor mode, the plugin maintains a global `window.memoryMap` that maps translation values to their message IDs:

```typescript
window.memoryMap = new Map([
  ["Welcome to our site", {
    ids: Set(["welcome", "homepage.title"]),
    type: "text",
    metadata: {
      language: "en",
      trackedAt: 1704067200000
    }
  }],
  // ... more entries
]);
```

This allows the Contentstorage live editor to:
1. Find which message IDs produced a given text
2. Enable click-to-edit functionality
3. Highlight translatable content on the page

### Memory Management

The plugin automatically limits the size of `window.memoryMap` to prevent memory leaks:

- Default limit: 10,000 entries
- Oldest entries are removed first (based on `trackedAt` timestamp)
- Configurable via `maxMemoryMapSize` option

## Configuration Options

```tsx
<ContentstorageIntlProvider
  locale="en"
  messages={messages}

  // Optional: Enable debug logging
  debug={false}

  // Optional: Maximum number of entries in memoryMap
  maxMemoryMapSize={10000}

  // Optional: Custom query parameter for live editor detection
  liveEditorParam="contentstorage_live_editor"

  // Optional: Force live mode (useful for testing)
  forceLiveMode={false}

  // ... all other IntlProvider props
>
  <YourApp />
</ContentstorageIntlProvider>
```

## Usage with React

### With Hooks

```tsx
import { useIntl, ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';

function MyComponent() {
  const intl = useIntl();

  return (
    <div>
      <h1>{intl.formatMessage({ id: 'welcome' })}</h1>
      <p>{intl.formatMessage({ id: 'greeting' }, { name: 'User' })}</p>
    </div>
  );
}

function App() {
  return (
    <ContentstorageIntlProvider locale="en" messages={messages}>
      <MyComponent />
    </ContentstorageIntlProvider>
  );
}
```

### With Components

```tsx
import { FormattedMessage, ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';

function MyComponent() {
  return (
    <div>
      <h1><FormattedMessage id="welcome" /></h1>
      <p><FormattedMessage id="greeting" values={{ name: 'User' }} /></p>
    </div>
  );
}

function App() {
  return (
    <ContentstorageIntlProvider locale="en" messages={messages}>
      <MyComponent />
    </ContentstorageIntlProvider>
  );
}
```

## Usage with Next.js

### App Router (Next.js 13+)

```tsx
// app/providers.tsx
'use client';

import { ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';
import messages from './messages/en.json';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ContentstorageIntlProvider locale="en" messages={messages}>
      {children}
    </ContentstorageIntlProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pages Router (Next.js 12 and below)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ContentstorageIntlProvider } from '@contentstorage/react-intl-plugin';
import messages from '../messages/en.json';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ContentstorageIntlProvider locale="en" messages={messages}>
      <Component {...pageProps} />
    </ContentstorageIntlProvider>
  );
}
```

## Testing

### Force Live Mode

For testing purposes, you can force live mode:

```tsx
<ContentstorageIntlProvider
  locale="en"
  messages={messages}
  forceLiveMode={true} // Always enable tracking
>
  <YourApp />
</ContentstorageIntlProvider>
```

### Debug Memory Map

```typescript
import { debugMemoryMap } from '@contentstorage/react-intl-plugin';

// In browser console or your code
debugMemoryMap();

// Output:
// [Contentstorage] Memory map contents:
// Total entries: 156
// ┌─────────┬──────────────────────────────┬─────────────────────┐
// │ (index) │ value                        │ keys                │
// ├─────────┼──────────────────────────────┼─────────────────────┤
// │    0    │ 'Welcome to our site'        │ 'welcome'           │
// └─────────┴──────────────────────────────┴─────────────────────┘
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2019+ features required
- React 16.8+ (hooks support)

## TypeScript

Full TypeScript support included with type definitions:

```typescript
import type {
  ContentstorageIntlProviderProps,
  MemoryMap,
  MemoryMapEntry,
  ContentstorageWindow,
} from '@contentstorage/react-intl-plugin';
```

## Performance

- **Zero overhead in production** - Tracking only happens in live editor
- **Minimal overhead in editor** - Simple Map operations, ~1ms per translation
- **Automatic cleanup** - Old entries removed to prevent memory leaks
- **One-time tracking** - Static messages tracked once on load

## Troubleshooting

### memoryMap is empty

**Problem**: `window.memoryMap` exists but has no entries.

**Solutions**:
- Verify you're in an iframe: `window.self !== window.top`
- Check URL has `?contentstorage_live_editor=true`
- Enable debug mode to see what's being tracked
- Ensure messages are being passed to provider

### Live editor can't find translations

**Problem**: Clicking on translated text doesn't work in live editor.

**Solutions**:
- Verify translation values exactly match rendered text
- Check that message IDs are being tracked (enable debug mode)
- Ensure messages are passed to `ContentstorageIntlProvider`

### TypeScript errors

**Problem**: TypeScript can't find type definitions.

**Solutions**:
- Ensure `@types/react` is installed
- Check `tsconfig.json` has `"esModuleInterop": true`
- Try importing types explicitly: `import type { ... }`

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.contentstorage.app
- Issues: https://github.com/contentstorage/react-intl-plugin/issues
- Email: support@contentstorage.app
