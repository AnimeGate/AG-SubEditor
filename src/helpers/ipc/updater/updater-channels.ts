export const UPDATER_CHANNELS = {
  // Main -> Renderer events
  CHECKING_FOR_UPDATE: "updater:checking-for-update",
  UPDATE_AVAILABLE: "updater:update-available",
  UPDATE_NOT_AVAILABLE: "updater:update-not-available",
  DOWNLOAD_PROGRESS: "updater:download-progress",
  UPDATE_DOWNLOADED: "updater:update-downloaded",
  UPDATE_ERROR: "updater:update-error",

  // Renderer -> Main commands
  START_DOWNLOAD: "updater:start-download",
  INSTALL_NOW: "updater:install-now",
  CHECK_FOR_UPDATES: "updater:check-for-updates",
} as const;
