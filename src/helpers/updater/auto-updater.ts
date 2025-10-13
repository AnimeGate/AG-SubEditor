import { autoUpdater } from "electron-updater";
import { dialog } from "electron";
import log from "electron-log";

// Configure logging
log.transports.file.level = "info";
autoUpdater.logger = log;

// For private repos, electron-updater can use GitHub token
// The token can be set via environment variable or embedded
// For private distribution to friends, we'll use the publish token approach
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

export function initializeAutoUpdater(isDevelopment: boolean) {
  if (isDevelopment) {
    log.info("Auto-updater disabled in development mode");
    return;
  }

  log.info("Initializing electron-updater for private repository");

  // Check for updates on app start (wait 3 seconds after launch)
  setTimeout(() => {
    checkForUpdates();
  }, 3000);

  // Check for updates every hour
  setInterval(
    () => {
      checkForUpdates();
    },
    60 * 60 * 1000
  ); // 1 hour

  // Auto-updater event handlers
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("No updates available. Current version:", info.version);
  });

  autoUpdater.on("error", (error) => {
    log.error("Error in auto-updater:", error);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version);

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
          setImmediate(() => autoUpdater.quitAndInstall());
        }
      });
  });
}

function checkForUpdates() {
  try {
    autoUpdater.checkForUpdates();
  } catch (error) {
    log.error("Failed to check for updates:", error);
  }
}

// Export function for manual update check
export function checkForUpdatesManually() {
  checkForUpdates();
}
