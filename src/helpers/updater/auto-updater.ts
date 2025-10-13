import { autoUpdater } from "electron";
import { dialog } from "electron";
import log from "electron-log";

const GITHUB_REPO = "AnimeGate/AG-SubEditor";
const UPDATE_SERVER_URL = `https://github.com/${GITHUB_REPO}`;

// Configure logging
log.transports.file.level = "info";
// Note: autoUpdater.logger is not available in all platforms, we use electron-log directly

export function initializeAutoUpdater(isDevelopment: boolean) {
  if (isDevelopment) {
    log.info("Auto-updater disabled in development mode");
    return;
  }

  // Set the feed URL for Squirrel.Windows
  const platform = process.platform;
  if (platform === "win32") {
    const feedURL = `${UPDATE_SERVER_URL}/releases/latest/download`;
    try {
      autoUpdater.setFeedURL({ url: feedURL } as any);
      log.info(`Auto-updater feed URL set to: ${feedURL}`);
    } catch (error) {
      log.error("Failed to set feed URL:", error);
    }
  } else {
    log.info(`Auto-updater not supported on platform: ${platform}`);
    return;
  }

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

  autoUpdater.on("update-available", () => {
    log.info("Update available. Downloading...");
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No updates available. App is up to date.");
  });

  autoUpdater.on("error", (error) => {
    log.error("Error in auto-updater:", error);
  });

  autoUpdater.on("update-downloaded", () => {
    log.info("Update downloaded successfully");

    // Notify user about the update
    dialog
      .showMessageBox({
        type: "info",
        title: "Aktualizacja dostępna",
        message: "Nowa wersja została pobrana",
        detail:
          "Nowa wersja jest gotowa do zainstalowania. Aplikacja zostanie zrestartowana.",
        buttons: ["Zainstaluj teraz", "Później"],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Install now"
          autoUpdater.quitAndInstall();
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
