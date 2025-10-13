# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AG-SubEditor is a professional ASS (Advanced SubStation Alpha) subtitle editor built with Electron, React 19, TypeScript, and shadcn-ui. The application allows users to import .ass subtitle files, adjust timing for all or selected lines, and export the modified subtitles while preserving the original file format and styling.

**Key Features:**
- Import and parse ASS subtitle files
- Time adjustment (shift start/end times by seconds or milliseconds)
- Apply timing changes to all lines or selected lines only
- Preserve all ASS file metadata, styles, and formatting
- Dark/light theme support
- Polish and English localization
- Auto-update functionality via GitHub Releases

## Commands

### Development
- `npm start` - Start the app in development mode with Vite hot reload
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Check code formatting with Prettier (non-destructive)
- `npm run format:write` - Format all code with Prettier

### Testing
- `npm test` - Run Vitest unit tests once
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:unit` - Alias for test:watch
- `npm run test:e2e` - Run Playwright E2E tests (requires packaged app)
- `npm run test:all` - Run all tests (Vitest + Playwright)

**IMPORTANT**: E2E tests require the app to be packaged first. Run `npm run dist:dir` before E2E tests.

### Building and Distribution
- `npm run build` - Build the app for production (no packaging)
- `npm run dist:dir` - Build and package without creating installer (fast, for testing)
- `npm run dist` - Build and create NSIS installer
- `npm run publish` - Build and publish to GitHub Releases (auto-update)

**Note**: This project uses **electron-builder** with NSIS (not Electron Forge). Output goes to `release/` directory.

## Architecture

### Electron Process Model

The app follows Electron's standard three-process architecture:

1. **Main Process** (`src/main.ts`)
   - Creates and manages BrowserWindow instances
   - Registers IPC event listeners via `registerListeners()`
   - Dynamically imports React DevTools in development mode only
   - Initializes auto-updater (`src/helpers/updater/auto-updater.ts`)
   - Handles app lifecycle events

2. **Preload Script** (`src/preload.ts`)
   - Runs in isolated context with access to both Node.js and DOM APIs
   - Exposes IPC contexts to renderer via `exposeContexts()`
   - Uses `contextBridge` to safely expose APIs to renderer

3. **Renderer Process** (`src/renderer.ts`)
   - Entry point that imports and renders the React app (`src/App.tsx`)
   - Main component: `SubtitleEditor` at `src/components/subtitle-editor/SubtitleEditor.tsx`

### Application Structure

**Main Components:**
- `SubtitleEditor.tsx` - Root component managing state and file operations
- `FileUploadSection.tsx` - File import/export UI with version badge
- `TimeAdjustmentPanel.tsx` - Time shift controls (scrollable for small windows)
- `SubtitleGrid.tsx` - Virtualized table displaying subtitle lines
- `InfoBar.tsx` - Status bar showing selection and timing info

**Core Logic:**
- `src/lib/ass-parser.ts` - Parse and export ASS subtitle files
  - `parseASSFile()` - Converts ASS text to `SubtitleLine[]` objects
  - `exportASSFile()` - Reconstructs ASS file preserving original formatting
  - Handles timing in milliseconds internally
  - Preserves layer, style, margins, effects, and all metadata

### IPC Communication Pattern

IPC (Inter-Process Communication) is centralized in `src/helpers/ipc/`:

- **Context Exposure** (`context-exposer.ts`): Aggregates all context exposure functions
- **Listener Registration** (`listeners-register.ts`): Aggregates all IPC listeners for main process
- **Feature Modules**: Organized by feature (e.g., `theme/`, `window/`)
  - `*-channels.ts`: Defines channel name constants
  - `*-context.ts`: Exposes IPC methods to renderer via contextBridge
  - `*-listeners.ts`: Registers ipcMain handlers in main process

**Pattern for adding new IPC features:**
1. Create a new folder under `src/helpers/ipc/` (e.g., `feature/`)
2. Add `feature-channels.ts` with channel constants
3. Add `feature-context.ts` with contextBridge exposure
4. Add `feature-listeners.ts` with ipcMain handlers
5. Import and call in `context-exposer.ts` and `listeners-register.ts`

### Custom Title Bar

The app uses a hidden native title bar (`titleBarStyle: "hidden"`) with custom window controls:
- Platform-specific handling (macOS uses `hiddenInset` with traffic light positioning)
- Custom controls implemented via IPC in `src/helpers/ipc/window/`
- Window operations: minimize, maximize, close
- Custom drag region component: `src/components/DragWindowRegion.tsx`

### Theme System

Theme management with oklch color space (Tailwind CSS 4):
- Light/dark/system modes
- Local storage persistence via IPC
- Color definitions in `src/styles/global.css`
- `syncThemeWithLocal()` helper in `src/helpers/theme_helpers.ts`
- Theme toggle component: `src/components/ToggleTheme.tsx`

### Internationalization

i18next configured in `src/localization/`:
- Primary language: Polish (`pl`)
- Fallback language: English (`en`)
- `i18n.ts`: Initialization with inline resources
- `updateAppLanguage()` helper in `src/helpers/language_helpers.ts`
- Translation keys for subtitle editor UI, settings, and system messages

### Routing

TanStack Router with memory-based history (suitable for Electron):
- Routes defined in `src/routes/` using file-based routing
- Route tree auto-generated in `src/routeTree.gen.ts` (gitignored)
- Base layout: `src/layouts/BaseLayout.tsx`
- Main route: `/` renders `SubtitleEditor`

### Auto-Update System

**Critical**: Uses electron-updater + NSIS installer (NOT Squirrel or MSI)
- Configuration: `src/helpers/updater/auto-updater.ts`
- Checks for updates 3 seconds after app start, then hourly
- Downloads updates in background
- Shows Polish dialog: "Nowa wersja została pobrana"
- Installs on user confirmation or on app quit
- Logs to: `%APPDATA%\ag-subeditor\logs\main.log`

**Publishing Process:**
1. Bump version in `package.json`
2. Run `npm run publish`
3. Publish the draft GitHub release
4. Users with older versions auto-update

### UI Components

- **shadcn-ui**: Pre-built accessible components in `src/components/ui/`
- **Tailwind CSS 4**: Utility-first styling with `@tailwindcss/vite` plugin
- **Lucide React**: Icon library
- **Geist Font**: Default sans-serif font
- **Tomorrow Font**: Additional font for UI variety

### Path Aliases

TypeScript and Vite configured with `@/` alias pointing to `src/`:
```typescript
import { SubtitleLine } from "@/lib/ass-parser"
import { Button } from "@/components/ui/button"
```

## Development Notes

### Build System: electron-builder + vite-plugin-electron

**NOT using Electron Forge** - migrated to electron-builder for better NSIS support.

**Vite Configuration:**
- Single config: `vite.config.mts`
- Uses `vite-plugin-electron/simple` for main/preload builds
- Main entry: `src/main.ts` → `dist-electron/main.js`
- Preload entry: `src/preload.ts` → `dist-electron/preload.js`
- Renderer: standard Vite build → `dist/`

**Path Handling in src/main.ts:**
- Dev mode: `process.env.VITE_DEV_SERVER_URL`
- Production: `path.join(__dirname, "../dist/index.html")`

### Context Isolation

- Context isolation is enabled (`contextIsolation: true`)
- Node integration enabled but limited to preload script
- Always use `contextBridge.exposeInMainWorld()` to expose APIs to renderer
- Never directly expose Node.js modules to renderer process

### React Compiler

- React Compiler enabled via `babel-plugin-react-compiler`
- Automatic optimization of React components
- No manual memoization required in most cases

### electron-devtools-installer Handling

**Important**: In `src/main.ts`, devtools installer uses dynamic import:
```typescript
if (inDevelopment) {
  const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import("electron-devtools-installer");
}
```
This prevents production builds from failing (devtools-installer is devDependency only).

### Test Organization

- Unit tests: `src/tests/unit/` (Vitest with jsdom)
- E2E tests: `src/tests/e2e/` (Playwright)
- Test setup: `src/tests/unit/setup.ts`
- Coverage: V8 provider

### Working with ASS Files

**Format Details:**
- ASS files have sections: `[Script Info]`, `[V4+ Styles]`, `[Events]`
- Dialogue lines: `Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text`
- Time format: `H:MM:SS.CS` (centiseconds)
- Parser preserves all original formatting and metadata

**Key Functions:**
- `parseASSFile(content: string): SubtitleLine[]` - Extract dialogue lines
- `exportASSFile(originalContent: string, subtitles: SubtitleLine[]): string` - Replace dialogue lines while preserving everything else
- Times stored in milliseconds internally, converted to/from ASS format

## Adding shadcn-ui Components

Use the standard shadcn-ui CLI:
```bash
npx shadcn@latest add [component-name]
```

Components added to `src/components/ui/` with configuration from `components.json`.

## Common Issues

### File Locking During Builds
If `npm run dist` fails with "process cannot access the file":
1. Close all instances of AG-SubEditor.exe
2. Run: `taskkill /F /IM AG-SubEditor.exe /T`
3. Wait 2 seconds, then rebuild

### Auto-Update Not Working
- Verify NSIS installer is being used (not MSI or Squirrel)
- Check logs at `%APPDATA%\ag-subeditor\logs\main.log`
- Ensure latest.yml is in GitHub release assets
- Confirm release is published (not draft)

### Dark Theme Not Applying
- Colors use oklch color space in `src/styles/global.css`
- Theme stored in localStorage via IPC
- Check `syncThemeWithLocal()` is called on app start
