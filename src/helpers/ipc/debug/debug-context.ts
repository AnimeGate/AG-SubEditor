import { contextBridge, ipcRenderer } from "electron";
import { DEBUG_CHANNELS } from "./debug-channels";

/**
 * Expose debug logging API to renderer process
 */
export function exposeDebugContext(): void {
  contextBridge.exposeInMainWorld("debugAPI", {
    log: (
      level: "info" | "success" | "warn" | "error" | "debug" | "route" | "file" | "ffmpeg" | "queue" | "ipc",
      message: string,
      ...args: unknown[]
    ) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level, message, args });
    },

    info: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "info", message, args });
    },

    success: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "success", message, args });
    },

    warn: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "warn", message, args });
    },

    error: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "error", message, args });
    },

    debug: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "debug", message, args });
    },

    route: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "route", message, args });
    },

    file: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "file", message, args });
    },

    ffmpeg: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "ffmpeg", message, args });
    },

    queue: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "queue", message, args });
    },

    ipc: (message: string, ...args: unknown[]) => {
      ipcRenderer.send(DEBUG_CHANNELS.LOG, { level: "ipc", message, args });
    },
  });
}
