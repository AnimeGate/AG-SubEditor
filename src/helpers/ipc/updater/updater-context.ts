import { contextBridge, ipcRenderer } from "electron";
import { UPDATER_CHANNELS } from "./updater-channels";

export interface UpdateInfo {
  version: string;
  releaseNotes: string | null;
  releaseDate: string;
}

export interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export function exposeUpdaterContext() {
  contextBridge.exposeInMainWorld("updaterAPI", {
    // Commands
    startDownload: () => {
      ipcRenderer.send(UPDATER_CHANNELS.START_DOWNLOAD);
    },
    installNow: () => {
      ipcRenderer.send(UPDATER_CHANNELS.INSTALL_NOW);
    },
    checkForUpdates: () => {
      ipcRenderer.send(UPDATER_CHANNELS.CHECK_FOR_UPDATES);
    },

    // DEV ONLY: Test methods for simulating updates
    _testShowUpdate: () => {
      ipcRenderer.send("updater:simulate-update");
    },
    _testSimulateDownload: () => {
      ipcRenderer.send("updater:simulate-download");
    },

    // Event listeners
    onCheckingForUpdate: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(UPDATER_CHANNELS.CHECKING_FOR_UPDATE, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.CHECKING_FOR_UPDATE, listener);
    },
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) =>
        callback(info);
      ipcRenderer.on(UPDATER_CHANNELS.UPDATE_AVAILABLE, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.UPDATE_AVAILABLE, listener);
    },
    onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        info: { version: string },
      ) => callback(info);
      ipcRenderer.on(UPDATER_CHANNELS.UPDATE_NOT_AVAILABLE, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.UPDATE_NOT_AVAILABLE, listener);
    },
    onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        progress: DownloadProgress,
      ) => callback(progress);
      ipcRenderer.on(UPDATER_CHANNELS.DOWNLOAD_PROGRESS, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.DOWNLOAD_PROGRESS, listener);
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) =>
        callback(info);
      ipcRenderer.on(UPDATER_CHANNELS.UPDATE_DOWNLOADED, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.UPDATE_DOWNLOADED, listener);
    },
    onUpdateError: (callback: (error: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: string) =>
        callback(error);
      ipcRenderer.on(UPDATER_CHANNELS.UPDATE_ERROR, listener);
      return () =>
        ipcRenderer.removeListener(UPDATER_CHANNELS.UPDATE_ERROR, listener);
    },
  });
}
