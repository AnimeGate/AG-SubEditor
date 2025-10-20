import { contextBridge, ipcRenderer } from "electron";
import { FFMPEG_CHANNELS } from "./ffmpeg-channels";

export interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  bitrate: string;
  speed: string;
  percentage: number;
}

export interface FFmpegStartParams {
  videoPath: string;
  subtitlePath: string;
  outputPath: string;
}

export function exposeFfmpegContext() {
  contextBridge.exposeInMainWorld("ffmpegAPI", {
    // File selection
    selectVideoFile: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.SELECT_VIDEO_FILE);
    },
    selectSubtitleFile: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.SELECT_SUBTITLE_FILE);
    },
    selectOutputPath: async (defaultName: string) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.SELECT_OUTPUT_PATH, defaultName);
    },
    getDefaultOutputPath: async (videoPath: string, override?: { prefix?: string; directory?: string | null }) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.GET_DEFAULT_OUTPUT_PATH, videoPath, override);
    },

    // Process control
    startProcess: async (params: FFmpegStartParams) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.START_PROCESS, params);
    },
    cancelProcess: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.CANCEL_PROCESS);
    },
    checkGpu: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.CHECK_GPU);
    },
    openOutputFolder: async (filePath: string) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.OPEN_OUTPUT_FOLDER, filePath);
    },

    // FFmpeg Download
    checkInstalled: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.CHECK_INSTALLED);
    },
    startDownload: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.START_DOWNLOAD);
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      const listener = (_event: any, progress: any) => callback(progress);
      ipcRenderer.on(FFMPEG_CHANNELS.DOWNLOAD_PROGRESS, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.DOWNLOAD_PROGRESS, listener);
    },
    onDownloadComplete: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(FFMPEG_CHANNELS.DOWNLOAD_COMPLETE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.DOWNLOAD_COMPLETE, listener);
    },
    onDownloadError: (callback: (error: string) => void) => {
      const listener = (_event: any, error: string) => callback(error);
      ipcRenderer.on(FFMPEG_CHANNELS.DOWNLOAD_ERROR, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.DOWNLOAD_ERROR, listener);
    },

    // Event listeners
    onProgress: (callback: (progress: FFmpegProgress) => void) => {
      const listener = (_event: any, progress: FFmpegProgress) => callback(progress);
      ipcRenderer.on(FFMPEG_CHANNELS.PROGRESS_UPDATE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.PROGRESS_UPDATE, listener);
    },
    onLog: (callback: (data: { log: string; type: string }) => void) => {
      const listener = (_event: any, data: { log: string; type: string }) => callback(data);
      ipcRenderer.on(FFMPEG_CHANNELS.LOG_OUTPUT, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.LOG_OUTPUT, listener);
    },
    onComplete: (callback: (outputPath: string) => void) => {
      const listener = (_event: any, outputPath: string) => callback(outputPath);
      ipcRenderer.on(FFMPEG_CHANNELS.PROCESS_COMPLETE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.PROCESS_COMPLETE, listener);
    },
    onError: (callback: (error: string) => void) => {
      const listener = (_event: any, error: string) => callback(error);
      ipcRenderer.on(FFMPEG_CHANNELS.PROCESS_ERROR, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.PROCESS_ERROR, listener);
    },

    // Queue Management
    queueAddItem: async (item: any) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_ADD_ITEM, item);
    },
    queueAddItems: async (items: any[]) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_ADD_ITEMS, items);
    },
    queueRemoveItem: async (id: string) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_REMOVE_ITEM, id);
    },
    queueClear: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_CLEAR);
    },
    queueReorder: async (fromIndex: number, toIndex: number) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_REORDER, fromIndex, toIndex);
    },
    queueStart: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_START);
    },
    queuePause: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_PAUSE);
    },
    queueResume: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_RESUME);
    },
    queueGetAll: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_GET_ALL);
    },
    queueGetStats: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_GET_STATS);
    },
    queueUpdateSettings: async (settings: any) => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_UPDATE_SETTINGS, settings);
    },
    queueSelectFiles: async () => {
      return await ipcRenderer.invoke(FFMPEG_CHANNELS.QUEUE_SELECT_FILES);
    },

    // Queue Event Listeners
    onQueueUpdate: (callback: (queue: any[]) => void) => {
      const listener = (_event: any, queue: any[]) => callback(queue);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_UPDATE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_UPDATE, listener);
    },
    onQueueItemUpdate: (callback: (item: any) => void) => {
      const listener = (_event: any, item: any) => callback(item);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_ITEM_UPDATE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_ITEM_UPDATE, listener);
    },
    onQueueItemProgress: (callback: (data: { itemId: string; progress: any }) => void) => {
      const listener = (_event: any, data: { itemId: string; progress: any }) => callback(data);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_ITEM_PROGRESS, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_ITEM_PROGRESS, listener);
    },
    onQueueItemLog: (callback: (data: { itemId: string; log: string; type: string }) => void) => {
      const listener = (_event: any, data: { itemId: string; log: string; type: string }) => callback(data);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_ITEM_LOG, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_ITEM_LOG, listener);
    },
    onQueueItemComplete: (callback: (data: { itemId: string; outputPath: string }) => void) => {
      const listener = (_event: any, data: { itemId: string; outputPath: string }) => callback(data);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_ITEM_COMPLETE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_ITEM_COMPLETE, listener);
    },
    onQueueItemError: (callback: (data: { itemId: string; error: string }) => void) => {
      const listener = (_event: any, data: { itemId: string; error: string }) => callback(data);
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_ITEM_ERROR, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_ITEM_ERROR, listener);
    },
    onQueueComplete: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(FFMPEG_CHANNELS.QUEUE_COMPLETE, listener);
      return () => ipcRenderer.removeListener(FFMPEG_CHANNELS.QUEUE_COMPLETE, listener);
    },
  });
}
