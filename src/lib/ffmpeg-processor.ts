import { spawn, ChildProcess } from "child_process";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { FFmpegDownloader } from "./ffmpeg-downloader";

export interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  bitrate: string;
  speed: string;
  percentage: number;
  eta: string | null; // Estimated time remaining
}

export interface EncodingSettings {
  bitrate: string;
  useHardwareAccel: boolean;
}

export interface FFmpegCallbacks {
  onProgress: (progress: FFmpegProgress) => void;
  onLog: (log: string, type: "info" | "success" | "warning" | "error" | "debug" | "metadata") => void;
  onComplete: (outputPath: string) => void;
  onError: (error: string) => void;
}

export class FFmpegProcessor {
  private process: ChildProcess | null = null;
  private callbacks: FFmpegCallbacks;
  private videoDuration: number = 0;
  private outputPath: string = "";
  private startTime: number = 0;
  private lastProgressTime: number = 0;

  constructor(callbacks: FFmpegCallbacks) {
    this.callbacks = callbacks;
  }

  private getFfmpegPath(): string {
    // Check multiple locations for FFmpeg
    const isDev = !app.isPackaged;

    if (isDev) {
      // In development, check project folder first, then userData
      const projectPath = path.join(process.cwd(), "WYPALANIE", "ffmpeg.exe");
      if (fs.existsSync(projectPath)) {
        return projectPath;
      }
      // Fall back to downloaded FFmpeg in userData
      return FFmpegDownloader.getFfmpegPath();
    } else {
      // In production, always use downloaded FFmpeg in userData
      return FFmpegDownloader.getFfmpegPath();
    }
  }

  static async checkGpuAvailability(): Promise<{ available: boolean; info: string }> {
    return new Promise((resolve) => {
      // Use same logic as getFfmpegPath()
      let ffmpegPath: string;
      const isDev = !app.isPackaged;

      if (isDev) {
        // In development, check project folder first, then userData
        const projectPath = path.join(process.cwd(), "WYPALANIE", "ffmpeg.exe");
        if (fs.existsSync(projectPath)) {
          ffmpegPath = projectPath;
        } else {
          ffmpegPath = FFmpegDownloader.getFfmpegPath();
        }
      } else {
        // In production, always use downloaded FFmpeg in userData
        ffmpegPath = FFmpegDownloader.getFfmpegPath();
      }

      if (!fs.existsSync(ffmpegPath)) {
        resolve({ available: false, info: "FFmpeg not found" });
        return;
      }

      // Run ffmpeg with encoders list to check for NVENC
      const ffmpegProcess = spawn(ffmpegPath, ["-encoders"]);
      let output = "";

      ffmpegProcess.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      ffmpegProcess.stderr?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      ffmpegProcess.on("close", () => {
        // Check for hardware encoders
        const hasNVENC = output.includes("h264_nvenc");
        const hasQSV = output.includes("h264_qsv");
        const hasAMF = output.includes("h264_amf");

        if (hasNVENC) {
          resolve({ available: true, info: "NVIDIA NVENC detected" });
        } else if (hasQSV) {
          resolve({ available: true, info: "Intel Quick Sync detected" });
        } else if (hasAMF) {
          resolve({ available: true, info: "AMD AMF detected" });
        } else {
          resolve({ available: false, info: "No hardware encoder detected" });
        }
      });

      ffmpegProcess.on("error", () => {
        resolve({ available: false, info: "Error checking GPU" });
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        ffmpegProcess.kill();
        resolve({ available: false, info: "Detection timeout" });
      }, 3000);
    });
  }

  private parseTime(timeString: string): number {
    // Parse time format: HH:MM:SS.mmm or MM:SS.mmm
    const parts = timeString.split(":");
    let seconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS.mmm
      seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS.mmm
      seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
      seconds = parseFloat(timeString);
    }

    return seconds;
  }

  private parseDuration(data: string): void {
    // Extract duration from ffmpeg output: Duration: HH:MM:SS.mmm
    const durationMatch = data.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
    if (durationMatch) {
      this.videoDuration = this.parseTime(durationMatch[1]);
      this.callbacks.onLog(`Video duration detected: ${durationMatch[1]} (${this.videoDuration}s)`, "metadata");
    }
  }

  private formatETA(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) return "Calculating...";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private categorizeLog(log: string): "info" | "success" | "warning" | "error" | "debug" | "metadata" {
    const lower = log.toLowerCase();

    // Errors
    if (lower.includes("error") || lower.includes("failed") || lower.includes("invalid")) {
      return "error";
    }

    // Warnings
    if (lower.includes("warning") || lower.includes("deprecated") ||
        lower.includes("not found") && !lower.includes("glyph")) {
      return "warning";
    }

    // Success
    if (lower.includes("completed") || lower.includes("success") || lower.includes("done")) {
      return "success";
    }

    // Metadata (codec info, stream info, etc.)
    if (lower.includes("stream") || lower.includes("duration") || lower.includes("encoder") ||
        lower.includes("bitrate") || lower.includes("video:") || lower.includes("audio:")) {
      return "metadata";
    }

    // Debug (very technical)
    if (lower.includes("libav") || lower.includes("configuration:")) {
      return "debug";
    }

    // Default to info
    return "info";
  }

  private parseProgress(data: string): void {
    // Parse ffmpeg progress output
    // Example: frame=  123 fps=45 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1634.2kbits/s speed=1.5x

    if (!data.includes("frame=")) return;

    const frameMatch = data.match(/frame=\s*(\d+)/);
    const fpsMatch = data.match(/fps=\s*([\d.]+)/);
    const timeMatch = data.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
    const bitrateMatch = data.match(/bitrate=\s*([\d.]+\w+\/s)/);
    const speedMatch = data.match(/speed=\s*([\d.]+x)/);

    if (timeMatch) {
      const currentTime = this.parseTime(timeMatch[1]);
      const percentage = this.videoDuration > 0
        ? Math.min(100, (currentTime / this.videoDuration) * 100)
        : 0;

      // Calculate ETA based on encoding speed
      let eta: string | null = null;
      if (this.videoDuration > 0 && percentage > 0 && percentage < 100) {
        const now = Date.now();
        const elapsed = (now - this.startTime) / 1000; // seconds
        const estimatedTotal = elapsed / (percentage / 100);
        const remaining = estimatedTotal - elapsed;
        eta = this.formatETA(remaining);
      }

      const progress: FFmpegProgress = {
        frame: frameMatch ? parseInt(frameMatch[1]) : 0,
        fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
        time: timeMatch[1],
        bitrate: bitrateMatch ? bitrateMatch[1] : "N/A",
        speed: speedMatch ? speedMatch[1] : "N/A",
        percentage: Math.round(percentage * 100) / 100,
        eta,
      };

      this.callbacks.onProgress(progress);
    }
  }

  async start(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    settings: EncodingSettings = { bitrate: "2400k", useHardwareAccel: false }
  ): Promise<void> {
    if (this.process) {
      throw new Error("A process is already running");
    }

    // Validate input files exist
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!fs.existsSync(subtitlePath)) {
      throw new Error(`Subtitle file not found: ${subtitlePath}`);
    }

    this.outputPath = outputPath;
    this.videoDuration = 0;
    this.startTime = Date.now();

    const ffmpegPath = this.getFfmpegPath();

    if (!fs.existsSync(ffmpegPath)) {
      throw new Error(`FFmpeg executable not found: ${ffmpegPath}`);
    }

    this.callbacks.onLog(`Starting FFmpeg process...`, "info");
    this.callbacks.onLog(`FFmpeg path: ${ffmpegPath}`, "debug");
    this.callbacks.onLog(`Video: ${videoPath}`, "info");
    this.callbacks.onLog(`Subtitles: ${subtitlePath}`, "info");
    this.callbacks.onLog(`Output: ${outputPath}`, "info");
    this.callbacks.onLog(`Quality: ${settings.bitrate} | Hardware Accel: ${settings.useHardwareAccel ? "ON" : "OFF"}`, "info");

    // Escape subtitle path for FFmpeg's subtitles filter
    // Replace backslashes with escaped backslashes and escape special characters
    const escapedSubtitlePath = subtitlePath
      .replace(/\\/g, "\\\\\\\\")  // Escape backslashes for FFmpeg filter
      .replace(/:/g, "\\:")         // Escape colons
      .replace(/'/g, "\\'");        // Escape single quotes

    // Build FFmpeg arguments
    const args: string[] = [];

    // Hardware acceleration (must come before input)
    if (settings.useHardwareAccel) {
      // Try NVENC (NVIDIA), fallback handled by FFmpeg
      args.push("-hwaccel", "auto");
      this.callbacks.onLog(`Hardware acceleration enabled`, "info");
    }

    // Input
    args.push("-i", videoPath);

    // Video filter (subtitles + format conversion)
    // Add format=yuv420p to ensure 8-bit output for hardware encoders
    // This fixes 10-bit input videos that h264_nvenc cannot encode directly
    if (settings.useHardwareAccel) {
      args.push("-vf", `subtitles='${escapedSubtitlePath}',format=yuv420p`);
    } else {
      args.push("-vf", `subtitles='${escapedSubtitlePath}'`);
    }

    // Video codec and quality
    if (settings.useHardwareAccel) {
      // Try hardware encoder, FFmpeg will fallback if not available
      args.push("-c:v", "h264_nvenc"); // NVIDIA
      args.push("-b:v", settings.bitrate);
      args.push("-preset", "p2");
      args.push("-tune", "hq");
      args.push("-rc:v", "vbr"); // Variable bitrate for better quality/speed balance
      args.push("-gpu", "0"); // Explicitly use first GPU
    } else {
      // Software encoding
      args.push("-c:v", "libx264");
      args.push("-b:v", settings.bitrate);
      args.push("-preset", "veryfast");
      args.push("-tune", "animation");
    }

    // Audio copy (no re-encoding)
    args.push("-c:a", "copy");

    // Overwrite output
    args.push("-y");

    // Output file
    args.push(outputPath);

    this.callbacks.onLog(`Command: ${ffmpegPath} ${args.join(" ")}`, "debug");

    return new Promise((resolve, reject) => {
      this.process = spawn(ffmpegPath, args);

      // FFmpeg outputs progress to stderr
      this.process.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();

        // Extract duration on first output
        if (this.videoDuration === 0) {
          this.parseDuration(output);
        }

        // Parse progress
        this.parseProgress(output);

        // Also send raw log output (but filter noisy lines)
        const lines = output.split("\n").filter(line =>
          line.trim() &&
          !line.includes("size=") &&
          !line.includes("frame=")
        );

        lines.forEach(line => {
          if (line.trim()) {
            const logType = this.categorizeLog(line);
            this.callbacks.onLog(line.trim(), logType);
          }
        });
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        this.callbacks.onLog(`[stdout] ${data.toString()}`, "debug");
      });

      this.process.on("error", (error) => {
        this.callbacks.onError(`Process error: ${error.message}`);
        this.process = null;
        reject(error);
      });

      this.process.on("close", (code) => {
        this.process = null;

        if (code === 0) {
          this.callbacks.onLog("Process completed successfully!", "success");
          this.callbacks.onComplete(this.outputPath);
          resolve();
        } else if (code !== null) {
          const error = `Process exited with code ${code}`;
          this.callbacks.onError(error);
          reject(new Error(error));
        } else {
          // Process was cancelled
          this.callbacks.onLog("Process was cancelled", "warning");
          resolve();
        }
      });
    });
  }

  cancel(): void {
    if (this.process) {
      this.callbacks.onLog("Cancelling process...", "warning");
      this.process.kill("SIGTERM");
      this.process = null;
    }
  }

  isRunning(): boolean {
    return this.process !== null;
  }
}
