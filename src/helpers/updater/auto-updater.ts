import { autoUpdater } from "electron-updater";
import { dialog } from "electron";
import log from "electron-log";
import { debugLog } from "../debug-mode";

// Configure logging
log.transports.file.level = "info";
autoUpdater.logger = log;

// For private repos with public releases, electron-updater can access updates
// without authentication. The repository stays private, only releases are public.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Explicitly set the GitHub provider configuration
autoUpdater.setFeedURL({
  provider: "github",
  owner: "AnimeGate",
  repo: "AG-SubEditor",
  private: false, // Set to false to use public releases
});

export function initializeAutoUpdater(isDevelopment: boolean) {
  if (isDevelopment) {
    log.info("Auto-updater disabled in development mode");
    debugLog.info("Auto-updater: Disabled in development mode");
    return;
  }

  log.info("Initializing electron-updater for private repository");
  debugLog.info("Auto-updater: Initializing for GitHub repository (AnimeGate/AG-SubEditor)");
  debugLog.info("Auto-updater: Auto-download enabled, auto-install on quit enabled");

  // Check for updates on app start (wait 3 seconds after launch)
  setTimeout(() => {
    debugLog.info("Auto-updater: Starting initial update check (3 seconds after launch)");
    checkForUpdates();
  }, 3000);

  // Check for updates every hour
  setInterval(
    () => {
      debugLog.info("Auto-updater: Starting scheduled update check (hourly)");
      checkForUpdates();
    },
    60 * 60 * 1000
  ); // 1 hour

  // Auto-updater event handlers
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
    debugLog.info("Auto-updater: Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
    debugLog.success(`Auto-updater: Update available - Version ${info.version}`);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("No updates available. Current version:", info.version);
    debugLog.info(`Auto-updater: No updates available - Current version: ${info.version}`);
  });

  autoUpdater.on("error", (error) => {
    log.error("Error in auto-updater:", error);
    debugLog.error(`Auto-updater: Error occurred - ${error.message || error}`);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
    const speedMB = (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2);
    const percentRounded = Math.round(progressObj.percent);
    debugLog.info(`Auto-updater: Download progress - ${percentRounded}% (${speedMB} MB/s)`);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version);
    debugLog.success(`Auto-updater: Update downloaded - Version ${info.version}`);
    debugLog.info("Auto-updater: Showing installation dialog to user");

    // Notify user about the update
    dialog
      .showMessageBox({
        type: "info",
        title: "Aktualizacja dostępna",
        message: "Nowa wersja została pobrana",
        detail: `Wersja ${info.version} jest gotowa do zainstalowania. Aplikacja zostanie zrestartowana.`,
        buttons: ["Zainstaluj teraz", "Później"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Install now"
          debugLog.info("Auto-updater: User chose to install now - Quitting and installing");
          setImmediate(() => autoUpdater.quitAndInstall());
        } else {
          debugLog.info("Auto-updater: User chose to install later - Will install on app quit");
        }
      });
  });
}

function checkForUpdates() {
  try {
    debugLog.debug("Auto-updater: Initiating update check");
    autoUpdater.checkForUpdates();
  } catch (error) {
    log.error("Failed to check for updates:", error);
    debugLog.error(`Auto-updater: Failed to check for updates - ${error}`);
  }
}

// Export function for manual update check
export function checkForUpdatesManually() {
  debugLog.info("Auto-updater: Manual update check requested");
  checkForUpdates();
}
