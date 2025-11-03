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

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.contentstorage.app
- Issues: https://github.com/contentstorage/react-intl-plugin/issues
- Email: support@contentstorage.app
