/**
 * Debug logger for renderer process
 * Sends logs to main process for colored console output
 */
export const debugLog = {
  info: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.info(message, ...args);
    }
  },

  success: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.success(message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.warn(message, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.error(message, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.debug(message, ...args);
    }
  },

  /**
   * Log routing/navigation events
   */
  route: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.route(message, ...args);
    }
  },

  /**
   * Log file operations (load, save, parse)
   */
  file: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.file(message, ...args);
    }
  },

  /**
   * Log IPC operations
   */
  ipc: (message: string, ...args: unknown[]) => {
    if (window.debugAPI) {
      window.debugAPI.ipc(message, ...args);
    }
  },
};
