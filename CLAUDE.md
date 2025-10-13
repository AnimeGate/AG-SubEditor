# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron desktop application built with React 19, TypeScript, and shadcn-ui components. It uses Electron Forge for building and packaging, with Vite as the build tool. The project is based on the electron-shadcn template and includes a custom title bar, theme switching, internationalization, and modern testing setup.

## Commands

### Development
- `npm run start` - Start the app in development mode with React DevTools
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Check code formatting with Prettier (non-destructive)
- `npm run format:write` - Format all code with Prettier

### Testing
- `npm run test` - Run Vitest unit tests once
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:unit` - Run Vitest tests (alias for test:watch)
- `npm run test:e2e` - Run Playwright E2E tests (requires built app)
- `npm run test:all` - Run all tests (Vitest + Playwright)

**IMPORTANT**: E2E tests with Playwright require the app to be packaged first. Run `npm run package`, `npm run make`, or `npm run publish` before running E2E tests.

### Building and Distribution
- `npm run package` - Package the app into platform-specific executable bundles
- `npm run make` - Generate distributables (.exe, .dmg, etc.) for distribution
- `npm run publish` - Publish artifacts to a distribution service

## Architecture

### Electron Process Model

The app follows Electron's standard three-process architecture:

1. **Main Process** (`src/main.ts`)
   - Creates and manages BrowserWindow instances
   - Registers IPC event listeners via `registerListeners()`
   - Installs React DevTools in development mode
   - Handles app lifecycle events

2. **Preload Script** (`src/preload.ts`)
   - Runs in isolated context with access to both Node.js and DOM APIs
   - Exposes IPC contexts to renderer via `exposeContexts()`
   - Uses `contextBridge` to safely expose APIs to renderer

3. **Renderer Process** (`src/renderer.ts`)
   - Entry point that imports and renders the React app (`src/App.tsx`)
   - Runs the React application in the browser context

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

Theme management is handled through:
- Local storage persistence
- IPC communication for theme changes
- Support for light, dark, and system modes
- `syncThemeWithLocal()` helper in `src/helpers/theme_helpers.ts`
- Theme toggle component: `src/components/ToggleTheme.tsx`

### Internationalization

i18next is configured in `src/localization/`:
- `i18n.ts`: i18next initialization with resources
- `langs.ts`: Language definitions
- `language.ts`: Language type definitions
- `updateAppLanguage()` helper in `src/helpers/language_helpers.ts`
- Fallback language: English (`en`)
- Currently supports: English, Portuguese (Brazil)

### Routing

TanStack Router is used for navigation:
- Memory-based history (suitable for Electron apps)
- Routes defined in `src/routes/` using file-based routing
- Route tree auto-generated in `src/routeTree.gen.ts`
- Base layout: `src/layouts/BaseLayout.tsx`

### UI Components

- **shadcn-ui**: Pre-built accessible components in `src/components/ui/`
- **Tailwind CSS 4**: Utility-first styling with `@tailwindcss/vite` plugin
- **Lucide React**: Icon library
- **Geist Font**: Default font family
- **Template Components**: `src/components/template/` (can be removed for clean start)

### Path Aliases

TypeScript and Vite are configured with `@/` alias pointing to `src/`:
```typescript
import { something } from "@/components/MyComponent"
```

## Development Notes

### Context Isolation

- Context isolation is enabled (`contextIsolation: true`)
- Node integration is enabled but limited to preload script
- Always use `contextBridge.exposeInMainWorld()` to expose APIs to renderer
- Never directly expose Node.js modules to renderer process

### React Compiler

- React Compiler is enabled by default via `babel-plugin-react-compiler`
- Automatic optimization of React components
- No manual memoization required in most cases

### Test Organization

- Unit tests: `src/tests/unit/` (Vitest with jsdom environment)
- E2E tests: `src/tests/e2e/` (Playwright)
- Test setup: `src/tests/unit/setup.ts`
- Coverage: Configured with V8 provider

### Vite Configuration

Three separate Vite configs:
- `vite.main.config.mts`: Main process build
- `vite.preload.config.mts`: Preload script build
- `vite.renderer.config.mts`: Renderer process build
- Test config: `vitest.config.ts` (separate from build configs)

### Security Features (Electron Fuses)

Configured in `forge.config.mts`:
- Cookie encryption enabled
- ASAR integrity validation enabled
- Only load app from ASAR
- Node CLI arguments disabled
- RunAsNode disabled

## Adding shadcn-ui Components

Use the standard shadcn-ui CLI to add components:
```bash
npx shadcn@latest add [component-name]
```

Components will be added to `src/components/ui/` with proper configuration from `components.json`.
