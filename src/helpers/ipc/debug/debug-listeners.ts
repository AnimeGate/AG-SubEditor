import { BrowserWindow, ipcMain } from "electron";
import { DEBUG_CHANNELS } from "./debug-channels";
import { debugLog } from "../../debug-mode";

/**
 * Register debug IPC listeners
 */
export function registerDebugListeners(_mainWindow: BrowserWindow): void {
  // Handle renderer debug logs
  ipcMain.on(
    DEBUG_CHANNELS.LOG,
    (
      _event,
      data: {
        level:
          | "info"
          | "success"
          | "warn"
          | "error"
          | "debug"
          | "route"
          | "file"
          | "ipc";
        message: string;
        args: unknown[];
      },
    ) => {
      const { level, message, args } = data;

      // Route to appropriate debug log function (this will also send to debug console)
      switch (level) {
        case "info":
          debugLog.info(`[RENDERER] ${message}`, ...args);
          break;
        case "success":
          debugLog.success(`[RENDERER] ${message}`, ...args);
          break;
        case "warn":
          debugLog.warn(`[RENDERER] ${message}`, ...args);
          break;
        case "error":
          debugLog.error(`[RENDERER] ${message}`, ...args);
          break;
        case "debug":
          debugLog.debug(`[RENDERER] ${message}`, ...args);
          break;
        case "route":
          debugLog.route(message, ...args);
          break;
        case "file":
          debugLog.file(message, ...args);
          break;
        case "ipc":
          debugLog.ipc(message, ...args);
          break;
      }
    },
  );
}
