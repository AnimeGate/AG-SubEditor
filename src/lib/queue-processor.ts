import {
  FFmpegProcessor,
  FFmpegProgress,
  EncodingSettings,
} from "./ffmpeg-processor";
import { debugLog } from "../helpers/debug-mode";
import * as fs from "fs";

export interface QueueItem {
  id: string;
  videoPath: string;
  videoName: string;
  subtitlePath: string;
  subtitleName: string;
  outputPath: string;
  status: "pending" | "processing" | "completed" | "error" | "cancelled";
  progress: FFmpegProgress | null;
  error?: string;
  logs: Array<{
    log: string;
    type: "info" | "success" | "warning" | "error" | "debug" | "metadata";
  }>;
}

export interface QueueCallbacks {
  onQueueUpdate: (queue: QueueItem[]) => void;
  onItemUpdate: (item: QueueItem) => void;
  onItemProgress: (itemId: string, progress: FFmpegProgress) => void;
  onItemLog: (
    itemId: string,
    log: string,
    type: "info" | "success" | "warning" | "error" | "debug" | "metadata",
  ) => void;
  onItemComplete: (itemId: string, outputPath: string) => void;
  onItemError: (itemId: string, error: string) => void;
  onQueueComplete: () => void;
}

export class QueueProcessor {
  private queue: QueueItem[] = [];
  private currentProcessor: FFmpegProcessor | null = null;
  private currentItemId: string | null = null;
  private isPaused: boolean = false;
  private isProcessing: boolean = false;
  private callbacks: QueueCallbacks;
  private settings: EncodingSettings;

  constructor(
    callbacks: QueueCallbacks,
    settings: EncodingSettings = { bitrate: "2400k" },
  ) {
    this.callbacks = callbacks;
    this.settings = settings;
  }

  updateSettings(settings: EncodingSettings): void {
    this.settings = settings;
  }

  addItem(
    item: Omit<QueueItem, "id" | "status" | "progress" | "logs">,
  ): string {
    const id = this.generateId();
    const queueItem: QueueItem = {
      ...item,
      id,
      status: "pending",
      progress: null,
      logs: [],
    };

    this.queue.push(queueItem);
    debugLog.queue(`Added item to queue: ${item.videoName} (ID: ${id})`);
    this.callbacks.onQueueUpdate([...this.queue]);
    return id;
  }

  addItems(
    items: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ): string[] {
    const ids: string[] = [];
    items.forEach((item) => {
      const id = this.addItem(item);
      ids.push(id);
    });
    return ids;
  }

  removeItem(id: string): void {
    // Don't allow removing currently processing item
    if (this.currentItemId === id) {
      this.cancelCurrent();
    }

    this.queue = this.queue.filter((item) => item.id !== id);
    this.callbacks.onQueueUpdate([...this.queue]);
  }

  updateItemOutput(id: string, newOutputPath: string): boolean {
    const item = this.queue.find((i) => i.id === id);
    if (!item) {
      return false;
    }

    // Don't allow updating currently processing item
    if (item.status === "processing") {
      debugLog.warn(
        `Cannot update output path for item ${id} - currently processing`,
      );
      return false;
    }

    item.outputPath = newOutputPath;
    this.callbacks.onItemUpdate({ ...item });
    this.callbacks.onQueueUpdate([...this.queue]);
    debugLog.queue(`Updated output path for ${item.videoName}: ${newOutputPath}`);
    return true;
  }

  clearQueue(): void {
    if (this.isProcessing) {
      this.pause();
      this.cancelCurrent();
    }

    this.queue = [];
    this.callbacks.onQueueUpdate([...this.queue]);
  }

  reorderItem(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.queue.length ||
      toIndex < 0 ||
      toIndex >= this.queue.length
    ) {
      return;
    }

    const [item] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, item);
    this.callbacks.onQueueUpdate([...this.queue]);
  }

  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  getItem(id: string): QueueItem | undefined {
    return this.queue.find((item) => item.id === id);
  }

  async start(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    debugLog.queue(
      `Starting queue processing (${this.queue.filter((i) => i.status === "pending").length} pending items)`,
    );
    this.isProcessing = true;
    this.isPaused = false;
    await this.processNext();
  }

  pause(): void {
    debugLog.queue("Pausing queue processing");
    this.isPaused = true;
    this.isProcessing = false;

    // Cancel current process and reset item to pending
    if (this.currentProcessor) {
      this.currentProcessor.cancel();
      this.currentProcessor = null;

      if (this.currentItemId) {
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          // Delete partial output file if it exists
          try {
            if (fs.existsSync(item.outputPath)) {
              fs.unlinkSync(item.outputPath);
              debugLog.queue(`Deleted partial output file: ${item.outputPath}`);
              item.logs.push({
                log: "Partial output file deleted",
                type: "info",
              });
            }
          } catch (err) {
            debugLog.warn(`Failed to delete partial output: ${err}`);
          }

          item.status = "pending";
          item.progress = null;
          item.logs.push({ log: "Process paused by user", type: "warning" });
          this.callbacks.onItemUpdate({ ...item });
          debugLog.queue(`Paused item: ${item.videoName} (ID: ${item.id})`);
        }
        this.currentItemId = null;
      }
    }
  }

  resume(): void {
    if (!this.isPaused) {
      return;
    }

    debugLog.queue("Resuming queue processing");
    this.isPaused = false;
    this.isProcessing = true;
    this.processNext();
  }

  private cancelCurrent(): void {
    if (this.currentProcessor) {
      this.currentProcessor.cancel();
      this.currentProcessor = null;

      if (this.currentItemId) {
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          item.status = "cancelled";
          item.logs.push({ log: "Process cancelled by user", type: "warning" });
          this.callbacks.onItemUpdate({ ...item });
        }
        this.currentItemId = null;
      }
    }
  }

  private async processNext(): Promise<void> {
    if (this.isPaused || !this.isProcessing) {
      return;
    }

    // Find next pending item
    const nextItem = this.queue.find((item) => item.status === "pending");

    if (!nextItem) {
      // Queue completed
      debugLog.queue("Queue processing completed - no more pending items");
      this.isProcessing = false;
      this.callbacks.onQueueComplete();
      return;
    }

    // Mark item as processing
    nextItem.status = "processing";
    nextItem.logs = [];
    nextItem.progress = null;
    this.currentItemId = nextItem.id;
    debugLog.queue(
      `Processing item: ${nextItem.videoName} (ID: ${nextItem.id})`,
    );
    debugLog.queue(`Video: ${nextItem.videoPath}`);
    debugLog.queue(`Subtitle: ${nextItem.subtitlePath}`);
    debugLog.queue(`Output: ${nextItem.outputPath}`);
    debugLog.queue(
      `Settings: bitrate=${this.settings.bitrate}` +
        (this.settings.gpuEncode !== undefined
          ? `, gpuEncode=${this.settings.gpuEncode}`
          : this.settings.useHardwareAccel !== undefined
            ? `, hwAccel=${this.settings.useHardwareAccel}`
            : "") +
        (this.settings.codec ? `, codec=${this.settings.codec}` : "") +
        (this.settings.preset ? `, preset=${this.settings.preset}` : "") +
        (this.settings.qualityMode ? `, rc=${this.settings.qualityMode}` : "") +
        (this.settings.cq !== undefined ? `, cq=${this.settings.cq}` : ""),
    );
    this.callbacks.onItemUpdate({ ...nextItem });

    // Create FFmpeg processor for this item
    this.currentProcessor = new FFmpegProcessor({
      onProgress: (progress) => {
        if (!this.currentItemId) return;
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          item.progress = progress;
          this.callbacks.onItemProgress(this.currentItemId, progress);
          this.callbacks.onItemUpdate({ ...item });
        }
      },
      onLog: (log, type) => {
        if (!this.currentItemId) return;
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          item.logs.push({ log, type });
          this.callbacks.onItemLog(this.currentItemId, log, type);
          this.callbacks.onItemUpdate({ ...item });
          // Log all FFmpeg output to debug console (unfiltered)
          debugLog.ffmpeg(`[${item.videoName}] ${log}`);
        }
      },
      onComplete: (outputPath) => {
        if (!this.currentItemId) return;
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          item.status = "completed";
          item.logs.push({
            log: `✓ Process completed successfully!`,
            type: "success",
          });
          item.logs.push({ log: `Output: ${outputPath}`, type: "info" });
          this.callbacks.onItemComplete(this.currentItemId, outputPath);
          this.callbacks.onItemUpdate({ ...item });
          debugLog.queue(
            `Item completed successfully: ${item.videoName} (ID: ${item.id})`,
          );
          debugLog.queue(`Output saved to: ${outputPath}`);
        }

        this.currentProcessor = null;
        this.currentItemId = null;

        // Process next item
        setTimeout(() => this.processNext(), 500);
      },
      onError: (error) => {
        if (!this.currentItemId) return;
        const item = this.queue.find((i) => i.id === this.currentItemId);
        if (item) {
          item.status = "error";
          item.error = error;
          item.logs.push({ log: `✗ Error: ${error}`, type: "error" });
          this.callbacks.onItemError(this.currentItemId, error);
          this.callbacks.onItemUpdate({ ...item });
          debugLog.error(
            `Item processing failed: ${item.videoName} (ID: ${item.id})`,
          );
          debugLog.error(`Error: ${error}`);
        }

        this.currentProcessor = null;
        this.currentItemId = null;

        // Process next item even if this one failed
        setTimeout(() => this.processNext(), 500);
      },
    });

    try {
      await this.currentProcessor.start(
        nextItem.videoPath,
        nextItem.subtitlePath,
        nextItem.outputPath,
        this.settings,
      );
    } catch (error) {
      // Error already handled in onError callback
      console.error("Queue processor error:", error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isRunning(): boolean {
    return this.isProcessing;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    error: number;
    cancelled: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((i) => i.status === "pending").length,
      processing: this.queue.filter((i) => i.status === "processing").length,
      completed: this.queue.filter((i) => i.status === "completed").length,
      error: this.queue.filter((i) => i.status === "error").length,
      cancelled: this.queue.filter((i) => i.status === "cancelled").length,
    };
  }
}
