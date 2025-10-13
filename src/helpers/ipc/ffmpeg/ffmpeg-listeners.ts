import { BrowserWindow, dialog, ipcMain, shell, Notification } from "electron";
import { FFMPEG_CHANNELS } from "./ffmpeg-channels";
import { FFmpegProcessor } from "@/lib/ffmpeg-processor";
import { FFmpegDownloader } from "@/lib/ffmpeg-downloader";
import * as path from "path";

let currentProcessor: FFmpegProcessor | null = null;
let currentDownloader: FFmpegDownloader | null = null;

export function addFfmpegEventListeners(mainWindow: BrowserWindow) {
  // File selection dialogs
  ipcMain.handle(FFMPEG_CHANNELS.SELECT_VIDEO_FILE, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Video Files", extensions: ["mkv", "mp4", "avi", "mov", "wmv", "flv", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Select Video File",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);

    return { filePath, fileName };
  });

  ipcMain.handle(FFMPEG_CHANNELS.SELECT_SUBTITLE_FILE, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "ASS Subtitles", extensions: ["ass"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Select Subtitle File",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);

    return { filePath, fileName };
  });

  ipcMain.handle(FFMPEG_CHANNELS.SELECT_OUTPUT_PATH, async (_event, defaultName: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: "MP4 Video", extensions: ["mp4"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Save Output Video",
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  // Process control
  ipcMain.handle(FFMPEG_CHANNELS.START_PROCESS, async (_event, params: {
    videoPath: string;
    subtitlePath: string;
    outputPath: string;
    settings?: {
      bitrate: string;
      useHardwareAccel: boolean;
    };
  }) => {
    if (currentProcessor?.isRunning()) {
      throw new Error("A process is already running. Please cancel it first.");
    }

    currentProcessor = new FFmpegProcessor({
      onProgress: (progress) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.PROGRESS_UPDATE, progress);
      },
      onLog: (log, type) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.LOG_OUTPUT, { log, type });
      },
      onComplete: (outputPath) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.PROCESS_COMPLETE, outputPath);
        currentProcessor = null;

        // Show desktop notification
        const fileName = path.basename(outputPath);
        const notification = new Notification({
          title: "Wypalanie zakończone!",
          body: `Plik ${fileName} został pomyślnie przetworzony.`,
          icon: undefined, // Uses default app icon
        });

        notification.on("click", () => {
          // Focus the window when notification is clicked
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();

          // Show the file in folder
          shell.showItemInFolder(outputPath);
        });

        notification.show();
      },
      onError: (error) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.PROCESS_ERROR, error);
        currentProcessor = null;
      },
    });

    try {
      await currentProcessor.start(
        params.videoPath,
        params.subtitlePath,
        params.outputPath,
        params.settings
      );
      return { success: true };
    } catch (error) {
      currentProcessor = null;
      throw error;
    }
  });

  ipcMain.handle(FFMPEG_CHANNELS.CANCEL_PROCESS, async () => {
    if (currentProcessor) {
      currentProcessor.cancel();
      currentProcessor = null;
      return { success: true };
    }
    return { success: false, message: "No process is running" };
  });

  ipcMain.handle(FFMPEG_CHANNELS.CHECK_GPU, async () => {
    return await FFmpegProcessor.checkGpuAvailability();
  });

  ipcMain.handle(FFMPEG_CHANNELS.OPEN_OUTPUT_FOLDER, async (_event, filePath: string) => {
    try {
      // Show the file in the folder (opens file explorer with file selected)
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      console.error("Failed to open output folder:", error);
      return { success: false, error: String(error) };
    }
  });

  // FFmpeg Download
  ipcMain.handle(FFMPEG_CHANNELS.CHECK_INSTALLED, async () => {
    return { installed: FFmpegDownloader.isInstalled() };
  });

  ipcMain.handle(FFMPEG_CHANNELS.START_DOWNLOAD, async () => {
    if (currentDownloader) {
      throw new Error("A download is already in progress");
    }

    currentDownloader = new FFmpegDownloader({
      onProgress: (progress) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_PROGRESS, progress);
      },
    });

    try {
      await currentDownloader.downloadAndInstall();
      mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_COMPLETE);
      currentDownloader = null;
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_ERROR, errorMessage);
      currentDownloader = null;
      throw error;
    }
  });
}
