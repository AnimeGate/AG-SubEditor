import { BrowserWindow, dialog, ipcMain, shell, Notification } from "electron";
import { FFMPEG_CHANNELS } from "./ffmpeg-channels";
import { FFmpegProcessor } from "@/lib/ffmpeg-processor";
import { FFmpegDownloader } from "@/lib/ffmpeg-downloader";
import { QueueProcessor } from "@/lib/queue-processor";
import { debugLog } from "../../debug-mode";
import * as path from "path";
import * as fs from "fs";
import { SettingsStore } from "@/helpers/settings/settings-store";

let currentProcessor: FFmpegProcessor | null = null;
let currentDownloader: FFmpegDownloader | null = null;
let queueProcessor: QueueProcessor | null = null;

export function addFfmpegEventListeners(mainWindow: BrowserWindow) {
  // File selection dialogs
  ipcMain.handle(FFMPEG_CHANNELS.SELECT_VIDEO_FILE, async () => {
    debugLog.ipc("IPC: SELECT_VIDEO_FILE called");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Video Files", extensions: ["mkv", "mp4", "avi", "mov", "wmv", "flv", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Select Video File",
    });

    if (result.canceled || result.filePaths.length === 0) {
      debugLog.ipc("IPC: SELECT_VIDEO_FILE - User cancelled");
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    debugLog.ipc(`IPC: SELECT_VIDEO_FILE - Selected: ${fileName}`);

    return { filePath, fileName };
  });

  ipcMain.handle(FFMPEG_CHANNELS.SELECT_SUBTITLE_FILE, async () => {
    debugLog.ipc("IPC: SELECT_SUBTITLE_FILE called");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "ASS Subtitles", extensions: ["ass"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Select Subtitle File",
    });

    if (result.canceled || result.filePaths.length === 0) {
      debugLog.ipc("IPC: SELECT_SUBTITLE_FILE - User cancelled");
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    debugLog.ipc(`IPC: SELECT_SUBTITLE_FILE - Selected: ${fileName}`);

    return { filePath, fileName };
  });

  ipcMain.handle(FFMPEG_CHANNELS.SELECT_OUTPUT_PATH, async (_event, defaultName: string) => {
    debugLog.ipc(`IPC: SELECT_OUTPUT_PATH called (default: ${defaultName})`);
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: "MP4 Video", extensions: ["mp4"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Save Output Video",
    });

    if (result.canceled || !result.filePath) {
      debugLog.ipc("IPC: SELECT_OUTPUT_PATH - User cancelled");
      return null;
    }

    debugLog.ipc(`IPC: SELECT_OUTPUT_PATH - Selected: ${result.filePath}`);
    return result.filePath;
  });

  // Resolve default output path based on settings and simple prefix
  ipcMain.handle(
    FFMPEG_CHANNELS.GET_DEFAULT_OUTPUT_PATH,
    async (_event, videoPath: string, override?: { prefix?: string; directory?: string | null }) => {
      const store = SettingsStore.getInstance();
      const outputSettings = store.getOutput();

      try {
        const videoDir = path.dirname(videoPath);
        const base = path.basename(videoPath, path.extname(videoPath));

        const prefix = (override?.prefix ?? outputSettings.filenamePrefix ?? "").trim();
        const customDir = override?.directory === undefined ? outputSettings.customFolder : override.directory;
        const useCustom = (outputSettings.locationMode === "custom_folder" && !!customDir) || (!!customDir && customDir.length > 0);
        const subfolderMode = outputSettings.locationMode === "input_subfolder";
        const targetDir = useCustom ? (customDir as string) : (subfolderMode ? path.join(videoDir, "wypalone") : videoDir);

        // ensure target dir exists if subfolder
        if (subfolderMode) {
          try { fs.mkdirSync(targetDir, { recursive: true }); } catch {}
        }

        const suffixWithSpace = prefix ? ` ${prefix}` : "";
        const sanitizedBase = sanitizeFileName(base + suffixWithSpace);
        const fileName = `${sanitizedBase}.mp4`;
        const full = path.join(targetDir, fileName);

        debugLog.ipc(`Resolved default output: ${full}`);
        return full;
      } catch (e) {
        debugLog.error(`Failed to resolve default output path: ${e}`);
        // Fallback: same folder, basic suffix
        try {
          const videoDir = path.dirname(videoPath);
          const base = path.basename(videoPath, path.extname(videoPath));
          return path.join(videoDir, `${base}_with_subs.mp4`);
        } catch {
          return "output_with_subs.mp4";
        }
      }
    }
  );

  function sanitizeFileName(name: string): string {
    // remove invalid characters for Windows/macOS/Linux
    return name.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
  }

  // Process control
  ipcMain.handle(FFMPEG_CHANNELS.START_PROCESS, async (_event, params: {
    videoPath: string;
    subtitlePath: string;
    outputPath: string;
    settings?: {
      bitrate: string;
      useHardwareAccel?: boolean;
      gpuEncode?: boolean;
      gpuDecode?: boolean;
      codec?: "h264";
      preset?: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";
      qualityMode?: "cq" | "vbr" | "vbr_hq" | "cbr";
      cq?: number;
      spatialAQ?: boolean;
      temporalAQ?: boolean;
      rcLookahead?: number;
      scaleWidth?: number;
      scaleHeight?: number;
    };
  }) => {
    debugLog.ipc("IPC: START_PROCESS called");
    debugLog.ipc(`  Video: ${params.videoPath}`);
    debugLog.ipc(`  Subtitle: ${params.subtitlePath}`);
    debugLog.ipc(`  Output: ${params.outputPath}`);
    if (params.settings) {
      const s = params.settings as any;
      debugLog.ipc(
        `  Settings: bitrate=${s.bitrate}, gpuEncode=${s.gpuEncode ?? s.useHardwareAccel}, gpuDecode=${s.gpuDecode}, codec=${s.codec ?? "h264"}, preset=${s.preset ?? "p4"}, rc=${s.qualityMode ?? "vbr_hq"}, cq=${s.cq ?? 19}`
      );
    }

    if (currentProcessor?.isRunning()) {
      debugLog.error("IPC: START_PROCESS - Process already running");
      throw new Error("A process is already running. Please cancel it first.");
    }

    const singleVideoName = path.basename(params.videoPath || "");

    currentProcessor = new FFmpegProcessor({
      onProgress: (progress) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.PROGRESS_UPDATE, progress);
      },
      onLog: (log, type) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.LOG_OUTPUT, { log, type });
        // Mirror FFmpeg logs to Debug Console for single-file mode as well
        debugLog.ffmpeg(`[${singleVideoName}] ${log}`);
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
    debugLog.ipc("IPC: CANCEL_PROCESS called");
    if (currentProcessor) {
      currentProcessor.cancel();
      currentProcessor = null;
      debugLog.ipc("IPC: CANCEL_PROCESS - Process cancelled");
      return { success: true };
    }
    debugLog.warn("IPC: CANCEL_PROCESS - No process is running");
    return { success: false, message: "No process is running" };
  });

  ipcMain.handle(FFMPEG_CHANNELS.CHECK_GPU, async () => {
    debugLog.ipc("IPC: CHECK_GPU called");
    const result = await FFmpegProcessor.checkGpuAvailability();
    debugLog.ipc(`IPC: CHECK_GPU - Result: ${result.available ? 'Available' : 'Not available'}`);
    if (result.available) {
      debugLog.ipc(`IPC: CHECK_GPU - Info: ${result.info}`);
    }
    return result;
  });

  ipcMain.handle(FFMPEG_CHANNELS.OPEN_OUTPUT_FOLDER, async (_event, filePath: string) => {
    debugLog.ipc(`IPC: OPEN_OUTPUT_FOLDER called: ${filePath}`);
    try {
      // Show the file in the folder (opens file explorer with file selected)
      shell.showItemInFolder(filePath);
      debugLog.ipc("IPC: OPEN_OUTPUT_FOLDER - Opened successfully");
      return { success: true };
    } catch (error) {
      debugLog.error(`IPC: OPEN_OUTPUT_FOLDER - Failed: ${error}`);
      console.error("Failed to open output folder:", error);
      return { success: false, error: String(error) };
    }
  });

  // FFmpeg Download
  ipcMain.handle(FFMPEG_CHANNELS.CHECK_INSTALLED, async () => {
    debugLog.ipc("IPC: CHECK_INSTALLED called");
    const installed = FFmpegDownloader.isInstalled();
    debugLog.ipc(`IPC: CHECK_INSTALLED - Result: ${installed}`);
    return { installed };
  });

  ipcMain.handle(FFMPEG_CHANNELS.START_DOWNLOAD, async () => {
    debugLog.ipc("IPC: START_DOWNLOAD called");
    if (currentDownloader) {
      debugLog.error("IPC: START_DOWNLOAD - Download already in progress");
      throw new Error("A download is already in progress");
    }

    debugLog.info("Starting FFmpeg download...");
    currentDownloader = new FFmpegDownloader({
      onProgress: (progress) => {
        mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_PROGRESS, progress);
      },
    });

    try {
      await currentDownloader.downloadAndInstall();
      debugLog.success("FFmpeg download completed successfully");
      mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_COMPLETE);
      currentDownloader = null;
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog.error(`FFmpeg download failed: ${errorMessage}`);
      mainWindow.webContents.send(FFMPEG_CHANNELS.DOWNLOAD_ERROR, errorMessage);
      currentDownloader = null;
      throw error;
    }
  });

  // ========== Queue Management ==========

  function initializeQueueProcessor(settings?: {
    bitrate: string;
    useHardwareAccel?: boolean;
    gpuEncode?: boolean;
    gpuDecode?: boolean;
    codec?: "h264";
    preset?: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";
    qualityMode?: "cq" | "vbr" | "vbr_hq" | "cbr";
    cq?: number;
    spatialAQ?: boolean;
    temporalAQ?: boolean;
    rcLookahead?: number;
    scaleWidth?: number;
    scaleHeight?: number;
  }) {
    if (!queueProcessor) {
      queueProcessor = new QueueProcessor(
        {
          onQueueUpdate: (queue) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_UPDATE, queue);
          },
          onItemUpdate: (item) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_ITEM_UPDATE, item);
          },
          onItemProgress: (itemId, progress) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_ITEM_PROGRESS, { itemId, progress });
          },
          onItemLog: (itemId, log, type) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_ITEM_LOG, { itemId, log, type });
          },
          onItemComplete: (itemId, outputPath) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_ITEM_COMPLETE, { itemId, outputPath });
          },
          onItemError: (itemId, error) => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_ITEM_ERROR, { itemId, error });
          },
          onQueueComplete: () => {
            mainWindow.webContents.send(FFMPEG_CHANNELS.QUEUE_COMPLETE);

            // Show desktop notification
            const notification = new Notification({
              title: "Kolejka zakończona!",
              body: "Wszystkie pliki zostały przetworzone.",
              icon: undefined,
            });

            notification.on("click", () => {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.focus();
            });

            notification.show();
          },
        },
        settings
      );
    }
  }

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_ADD_ITEM, async (_event, item: {
    videoPath: string;
    videoName: string;
    subtitlePath: string;
    subtitleName: string;
    outputPath: string;
  }) => {
    initializeQueueProcessor();
    const id = queueProcessor!.addItem(item);
    return { success: true, id };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_ADD_ITEMS, async (_event, items: Array<{
    videoPath: string;
    videoName: string;
    subtitlePath: string;
    subtitleName: string;
    outputPath: string;
  }>) => {
    initializeQueueProcessor();
    const ids = queueProcessor!.addItems(items);
    return { success: true, ids };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_REMOVE_ITEM, async (_event, id: string) => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    queueProcessor.removeItem(id);
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_CLEAR, async () => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    queueProcessor.clearQueue();
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_REORDER, async (_event, fromIndex: number, toIndex: number) => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    queueProcessor.reorderItem(fromIndex, toIndex);
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_START, async () => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    await queueProcessor.start();
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_PAUSE, async () => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    queueProcessor.pause();
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_RESUME, async () => {
    if (!queueProcessor) {
      return { success: false, message: "Queue not initialized" };
    }

    queueProcessor.resume();
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_GET_ALL, async () => {
    if (!queueProcessor) {
      return { queue: [] };
    }

    return { queue: queueProcessor.getQueue() };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_GET_STATS, async () => {
    if (!queueProcessor) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        error: 0,
        cancelled: 0,
      };
    }

    return queueProcessor.getQueueStats();
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_UPDATE_SETTINGS, async (_event, settings: {
    bitrate: string;
    useHardwareAccel?: boolean;
    gpuEncode?: boolean;
    gpuDecode?: boolean;
    codec?: "h264";
    preset?: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";
    qualityMode?: "cq" | "vbr" | "vbr_hq" | "cbr";
    cq?: number;
    spatialAQ?: boolean;
    temporalAQ?: boolean;
    rcLookahead?: number;
  }) => {
    initializeQueueProcessor(settings);
    queueProcessor!.updateSettings(settings);
    return { success: true };
  });

  ipcMain.handle(FFMPEG_CHANNELS.QUEUE_SELECT_FILES, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Video Files", extensions: ["mkv", "mp4", "avi", "mov", "wmv", "flv", "webm"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Select Video Files",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, files: [] };
    }

    // Return video files
    const videoFiles = result.filePaths.map(filePath => ({
      filePath,
      fileName: path.basename(filePath),
    }));

    return { success: true, files: videoFiles };
  });
}
