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
  });
}
