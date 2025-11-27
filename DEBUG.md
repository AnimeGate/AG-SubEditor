# Debug Mode Guide

AG-SubEditor includes a comprehensive debug mode that provides detailed colored console logs for troubleshooting.

## Enabling Debug Mode

### Development Mode

```bash
npm run start:debug
```

Or on Windows specifically:

```bash
npm run start:debug:win
```

### Production Build

Launch the installed application from command line with `--debug` flag:

**Windows:**

```cmd
"C:\Program Files\AG-SubEditor\AG-SubEditor.exe" --debug
```

**Or navigate to installation folder:**

```cmd
cd "C:\Program Files\AG-SubEditor"
AG-SubEditor.exe --debug
```

## What Debug Mode Shows

When debug mode is enabled:

- ✅ **Separate Debug Console Window** - A dedicated window with color-coded logs
- ✅ DevTools automatically opens in main application window
- ✅ Colored console logs in terminal/CMD window
- ✅ All logs saved to `%APPDATA%\ag-subeditor\logs\debug.log`

### Debug Console Window Features

The debug console window provides:

- **Real-time log streaming** - See all logs as they happen
- **Color-coded categories** - Easy identification of log types
- **Statistics** - Track total logs, errors, and warnings
- **Export** - Save logs to a text file
- **Clear** - Clear the console
- **Auto-scroll** - Automatically scrolls to new logs (disables when you scroll up)

### Log Categories

- 🧭 **[ROUTE]** - Page navigation (e.g., switching between Editor and Wypalarka)
- 📁 **[FILE]** - File operations (loading/saving ASS files with sizes and line counts)
- 📋 **[QUEUE]** - Queue management (add, start, pause, resume)
- 🔥 **[FFMPEG]** - Complete, unfiltered FFmpeg output (every line of stderr/stdout)
- 📡 **[IPC]** - Inter-process communication events
- ℹ️ **Info** - General information
- ✅ **Success** - Successful operations
- ⚠️ **Warning** - Warnings
- ❌ **Error** - Errors

## Example Output

```
[2025-10-14 12:34:56.123] [info] ═══════════════════════════════════════════════
[2025-10-14 12:34:56.123] [info] 🐛 DEBUG MODE ENABLED
[2025-10-14 12:34:56.124] [info] App version: 1.4.0
[2025-10-14 12:34:56.125] [info] Electron version: 38.1.2
[2025-10-14 12:34:56.126] [info] ═══════════════════════════════════════════════
[2025-10-14 12:34:56.234] [info] ℹ️  Creating main window...
[2025-10-14 12:34:57.123] [info] 🧭 [ROUTE] Navigated to: /wypalarka
[2025-10-14 12:35:00.456] [info] 📋 [QUEUE] Adding 3 items to queue
[2025-10-14 12:35:00.567] [info] 📋 [QUEUE] Added item to queue: video1.mkv (ID: 1234-abcd)
[2025-10-14 12:35:01.789] [info] 📋 [QUEUE] Starting queue processing (3 pending items)
[2025-10-14 12:35:02.012] [info] 📋 [QUEUE] Processing item: video1.mkv (ID: 1234-abcd)
[2025-10-14 12:35:02.234] [debug] 🔥 [FFMPEG] [video1.mkv] ffmpeg version 2024.12.11-full_build...
[2025-10-14 12:35:02.456] [debug] 🔥 [FFMPEG] [video1.mkv] Input #0, matroska,webm...
[2025-10-14 12:35:02.678] [debug] 🔥 [FFMPEG] [video1.mkv] Stream #0:0: Video: h264...
[2025-10-14 12:35:03.890] [debug] 🔥 [FFMPEG] [video1.mkv] frame=  124 fps=31 q=28.0 size=  1024kB time=00:00:04.12 bitrate=2034.5kbits/s speed=1.03x
```

## Troubleshooting

### No Debug Logs Appearing?

1. **Verify environment variable is set:**
   - Windows CMD: `echo %DEBUG%` should show `1`
   - PowerShell: `$env:DEBUG` should show `1`

2. **Check console output:**
   - Look for the banner: `🐛 DEBUG MODE ENABLED`
   - If you don't see it, debug mode is not active

3. **Check log file:**
   - Navigate to: `%APPDATA%\ag-subeditor\logs\`
   - Open `debug.log` to see all debug output

### DevTools Not Opening?

Debug mode automatically opens DevTools. If it doesn't:

- Press **Ctrl+Shift+I** (Windows/Linux) or **Cmd+Option+I** (Mac) to manually open
- Or right-click and select "Inspect Element"

## Disabling Debug Mode

Simply run the app normally without the debug flag or environment variable:

```bash
npm start
```

Or launch the installed app normally (double-click icon).
