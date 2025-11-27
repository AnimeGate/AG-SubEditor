import { autoUpdater, UpdateInfo as ElectronUpdateInfo } from "electron-updater";
import log from "electron-log";
import { debugLog } from "../debug-mode";
import { UPDATER_CHANNELS } from "../ipc/updater/updater-channels";
import { sendUpdaterEvent } from "../ipc/updater/updater-listeners";

// Configure logging
log.transports.file.level = "info";
autoUpdater.logger = log;

// Disable auto-download - user will click to download
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Explicitly set the GitHub provider configuration
autoUpdater.setFeedURL({
  provider: "github",
  owner: "AnimeGate",
  repo: "AG-SubEditor",
  private: false,
});

/**
 * Parse release notes from electron-updater format.
 * Release notes can be a string or an array of objects.
 */
function parseReleaseNotes(
  releaseNotes: ElectronUpdateInfo["releaseNotes"],
): string | null {
  if (!releaseNotes) return null;

  if (typeof releaseNotes === "string") {
    return releaseNotes;
  }

  // Handle array format (multiple releases)
  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((note) => {
        if (typeof note === "string") return note;
        if (note && typeof note === "object" && "note" in note) {
          return (note as { note: string }).note;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return null;
}

export function initializeAutoUpdater(isDevelopment: boolean) {
  if (isDevelopment) {
    log.info("Auto-updater disabled in development mode");
    debugLog.info("Auto-updater: Disabled in development mode");
    return;
  }

  log.info("Initializing electron-updater with custom UI");
  debugLog.info(
    "Auto-updater: Initializing for GitHub repository (AnimeGate/AG-SubEditor)",
  );
  debugLog.info("Auto-updater: Auto-download disabled, waiting for user action");

  // Check for updates on app start (wait 3 seconds after launch)
  setTimeout(() => {
    debugLog.info(
      "Auto-updater: Starting initial update check (3 seconds after launch)",
    );
    checkForUpdates();
  }, 3000);

  // Check for updates every hour
  setInterval(
    () => {
      debugLog.info("Auto-updater: Starting scheduled update check (hourly)");
      checkForUpdates();
    },
    60 * 60 * 1000,
  );

  // Auto-updater event handlers
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
    debugLog.info("Auto-updater: Checking for updates...");
    sendUpdaterEvent(UPDATER_CHANNELS.CHECKING_FOR_UPDATE);
  });

  autoUpdater.on("update-available", (info: ElectronUpdateInfo) => {
    log.info("Update available:", info.version);
    debugLog.success(
      `Auto-updater: Update available - Version ${info.version}`,
    );

    const releaseNotes = parseReleaseNotes(info.releaseNotes);

    sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on("update-not-available", (info: ElectronUpdateInfo) => {
    log.info("No updates available. Current version:", info.version);
    debugLog.info(
      `Auto-updater: No updates available - Current version: ${info.version}`,
    );
    sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_NOT_AVAILABLE, {
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    log.error("Error in auto-updater:", error);
    debugLog.error(`Auto-updater: Error occurred - ${error.message || error}`);
    sendUpdaterEvent(
      UPDATER_CHANNELS.UPDATE_ERROR,
      error.message || String(error),
    );
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`,
    );
    const speedMB = (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2);
    const percentRounded = Math.round(progressObj.percent);
    debugLog.info(
      `Auto-updater: Download progress - ${percentRounded}% (${speedMB} MB/s)`,
    );

    sendUpdaterEvent(UPDATER_CHANNELS.DOWNLOAD_PROGRESS, {
      bytesPerSecond: progressObj.bytesPerSecond,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on("update-downloaded", (info: ElectronUpdateInfo) => {
    log.info("Update downloaded:", info.version);
    debugLog.success(
      `Auto-updater: Update downloaded - Version ${info.version}`,
    );

    const releaseNotes = parseReleaseNotes(info.releaseNotes);

    sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_DOWNLOADED, {
      version: info.version,
      releaseNotes,
      releaseDate: info.releaseDate,
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
