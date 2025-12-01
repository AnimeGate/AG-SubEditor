import { ipcMain, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { UPDATER_CHANNELS } from "./updater-channels";
import { debugLog } from "../../debug-mode";

// DEV ONLY: Mock update info for testing
const mockUpdateInfo = {
  version: "99.0.0",
  releaseNotes: `# AG-SubEditor v1.17.0 - Changelog

## Subtitle Editor Improvements

This release focuses on improving the core subtitle editing experience.

### What's new?

**Timing Sync:**
- Import timing from a reference ASS file
- Preview timing changes before applying
- Apply timing changes to selected lines

**UI Improvements:**
- Improved navigation and layout
- Better keyboard shortcuts support
- Enhanced dark mode support

### Technical

- Streamlined codebase
- Improved performance
- Better error handling`,
  releaseDate: new Date().toISOString(),
};

export function registerUpdaterListeners() {
  // Handle start download command
  ipcMain.on(UPDATER_CHANNELS.START_DOWNLOAD, () => {
    debugLog.info("Auto-updater: Download requested by user");
    autoUpdater.downloadUpdate();
  });

  // Handle install now command
  ipcMain.on(UPDATER_CHANNELS.INSTALL_NOW, () => {
    debugLog.info("Auto-updater: Install now requested by user");
    setImmediate(() => autoUpdater.quitAndInstall());
  });

  // Handle manual check for updates
  ipcMain.on(UPDATER_CHANNELS.CHECK_FOR_UPDATES, () => {
    debugLog.info("Auto-updater: Manual update check requested");
    autoUpdater.checkForUpdates();
  });

  // DEV ONLY: Simulate update flow for testing
  ipcMain.on("updater:simulate-update", () => {
    debugLog.info("Auto-updater: [DEV] Simulating update flow");
    sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_AVAILABLE, mockUpdateInfo);
    debugLog.info("Auto-updater: [DEV] Sent UPDATE_AVAILABLE event");
  });

  // DEV ONLY: Simulate download progress
  ipcMain.on("updater:simulate-download", () => {
    debugLog.info("Auto-updater: [DEV] Simulating download progress");

    let percent = 0;
    const total = 50 * 1024 * 1024; // 50 MB

    const interval = setInterval(() => {
      percent += 5;
      const transferred = (total * percent) / 100;

      sendUpdaterEvent(UPDATER_CHANNELS.DOWNLOAD_PROGRESS, {
        bytesPerSecond: 2 * 1024 * 1024, // 2 MB/s
        percent,
        transferred,
        total,
      });

      if (percent >= 100) {
        clearInterval(interval);
        // Send download complete with same changelog
        sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_DOWNLOADED, mockUpdateInfo);
        debugLog.info("Auto-updater: [DEV] Sent UPDATE_DOWNLOADED event");
      }
    }, 300);
  });
}

/**
 * Send updater event to all renderer windows
 */
export function sendUpdaterEvent(channel: string, data?: unknown) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}
