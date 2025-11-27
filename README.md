# AG-SubEditor

A professional ASS (Advanced SubStation Alpha) subtitle editor built with Electron.

## Features

- **Subtitle Editing**: Import, edit, and export ASS subtitle files
- **Time Adjustment**: Shift start/end times by milliseconds or seconds
- **Selective Editing**: Apply timing changes to selected lines or all subtitles
- **Format Preservation**: Maintains all ASS metadata, styles, and formatting
- **Subtitle Burner**: Burn subtitles permanently into video files
- **Theme Support**: Light and dark themes
- **Localization**: Polish and English language support
- **Auto Updates**: Automatic updates via GitHub Releases

## Installation

Download the latest release from [GitHub Releases](https://github.com/AnimeGate/AG-SubEditor/releases).

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Create installer
npm run dist
```

## Testing

### Auto-Updater Testing

To test the update dialog UI locally, open DevTools (F12) and run in the console:

```javascript
// Show update available dialog with mock changelog
window.updaterAPI._testShowUpdate()

// Simulate download progress after showing update dialog
window.updaterAPI._testSimulateDownload()
```

## Tech Stack

- Electron 38
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- TanStack Router

## License

MIT
