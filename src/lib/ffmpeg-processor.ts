import { spawn, ChildProcess } from "child_process";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { FFmpegDownloader } from "./ffmpeg-downloader";

/**
 * FFmpeg Subtitle Filter Path Escaping
 * =====================================
 *
 * The subtitles filter in FFmpeg requires careful path escaping due to
 * multiple parsing layers:
 *
 * Layer 1: FFmpeg option parser
 *   -vf "subtitles='C:\\path\\file.ass'"
 *   The outer quotes protect the entire filter string
 *
 * Layer 2: Filter graph parser
 *   Parses: subtitles='C:\\path\\file.ass'
 *   Special chars: [ ] ; , = ' need escaping with backslash
 *
 * Layer 3: Subtitles filter (libass)
 *   Receives: C:\path\file.ass (after unescaping)
 *   On Windows, backslashes are path separators
 *
 * Escaping chain for backslash on Windows:
 *   Original file:     C:\path\file.ass
 *   In JS string:      "C:\\path\\file.ass" (2 backslashes)
 *   Escaped for FFmpeg: "C\\\\:\\\\path\\\\file.ass" (4 backslashes)
 *   After filter parse: C\\path\\file.ass (2 backslashes)
 *   After libass parse: C:\path\file.ass (1 backslash - correct!)
 */

/**
 * Escapes a file path for use in FFmpeg's subtitles filter.
 *
 * @param filePath - The absolute path to the subtitle file
 * @returns Escaped path safe for use in subtitles filter
 *
 * @example
 * escapeSubtitlePath("C:\\Users\\test\\subtitles.ass")
 * // Returns: "C\\\\:\\\\Users\\\\test\\\\subtitles.ass"
 */
export function escapeSubtitlePath(filePath: string): string {
  return (
    filePath
      // Step 1: Escape backslashes first (must be done before other escapes)
      // Windows paths need 4 backslashes due to double unescaping by FFmpeg + libass
      .replace(/\\/g, "\\\\\\\\")
      // Step 2: Escape colons (Windows drive letters like C:)
      .replace(/:/g, "\\:")
      // Step 3: Escape single quotes (string delimiters)
      .replace(/'/g, "\\'")
      // Step 4: Escape filter graph special characters
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/=/g, "\\=")
  );
}

/**
 * Validates that a path is safe for FFmpeg processing.
 *
 * @param filePath - Path to validate
 * @returns Object with isValid flag and optional error message
 *
 * @example
 * validatePathForFFmpeg("C:\\Users\\test.ass")
 * // Returns: { isValid: true }
 *
 * validatePathForFFmpeg("C:\\Users\\test\ninjection.ass")
 * // Returns: { isValid: false, error: "Path contains newline characters" }
 */
export function validatePathForFFmpeg(filePath: string): {
  isValid: boolean;
  error?: string;
} {
  // Check for newlines (could break command)
  if (filePath.includes("\n") || filePath.includes("\r")) {
    return { isValid: false, error: "Path contains newline characters" };
  }

  // Check for null bytes
  if (filePath.includes("\0")) {
    return { isValid: false, error: "Path contains null bytes" };
  }

  // Check path length (Windows MAX_PATH = 260, but can be longer with \\?\ prefix)
  if (filePath.length > 32767) {
    return { isValid: false, error: "Path exceeds maximum length" };
  }

  // Check for problematic Unicode characters
  // Some Unicode characters are invisible or could cause parsing issues
  const hasProblematicUnicode = /[\u200B-\u200F\u2028-\u202F\uFEFF]/.test(filePath);
  if (hasProblematicUnicode) {
    return {
      isValid: false,
      error: "Path contains invisible Unicode characters",
    };
  }

  return { isValid: true };
}

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
  // Legacy/basic
  bitrate: string;
  useHardwareAccel?: boolean;
  // Extended (all optional)
  gpuEncode?: boolean; // replaces useHardwareAccel
  gpuDecode?: boolean; // default false for hard-subs
  codec?: "h264";
  preset?: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";
  qualityMode?: "cq" | "vbr" | "vbr_hq" | "cbr";
  cq?: number;
  spatialAQ?: boolean;
  temporalAQ?: boolean;
  rcLookahead?: number;
}

export interface FFmpegCallbacks {
  onProgress: (progress: FFmpegProgress) => void;
  onLog: (
    log: string,
    type: "info" | "success" | "warning" | "error" | "debug" | "metadata",
  ) => void;
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

  private normalizeSettings(input: EncodingSettings): EncodingSettings & {
    gpuEncode: boolean;
    gpuDecode: boolean;
    codec: "h264";
    hwEncoder: "nvenc" | "qsv" | "amf" | "auto";
    preset: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7" | undefined;
    qualityMode: "cq" | "vbr" | "vbr_hq" | "cbr" | undefined;
    cq: number | undefined;
    spatialAQ: boolean | undefined;
    temporalAQ: boolean | undefined;
    rcLookahead: number | undefined;
    bitrate: string;
  } {
    const gpuEncode = input.gpuEncode ?? input.useHardwareAccel ?? false;
    const gpuDecode = input.gpuDecode ?? false;
    const codec = input.codec ?? "h264";

    // Determine available hardware encoders from last GPU check info is not cached here; use heuristic
    // Prefer NVENC by default; FFmpeg will error if unavailable and we log the command
    let hwEncoder: "nvenc" | "qsv" | "amf" | "auto" = "auto";
    if (gpuEncode) {
      // We can't synchronously query -encoders here; choose NVENC as default
      hwEncoder = "nvenc";
    }

    const preset = input.preset ?? "p4";
    const qualityMode = input.qualityMode ?? "vbr_hq";
    const cq = input.cq ?? 19;
    const spatialAQ = input.spatialAQ ?? true;
    const temporalAQ = input.temporalAQ ?? true;
    const rcLookahead = input.rcLookahead ?? 20;
    const bitrate = input.bitrate;

    return {
      ...input,
      gpuEncode,
      gpuDecode,
      codec,
      hwEncoder,
      preset,
      qualityMode,
      cq,
      spatialAQ,
      temporalAQ,
      rcLookahead,
      bitrate,
    };
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

  static async checkGpuAvailability(): Promise<{
    available: boolean;
    info: string;
  }> {
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

      // Run ffmpeg with encoders list to check for NVENC/QSV/AMF
      const ffmpegProcess = spawn(ffmpegPath, ["-encoders"]);
      let output = "";

      ffmpegProcess.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      ffmpegProcess.stderr?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      ffmpegProcess.on("close", () => {
        // Check for hardware encoders (H.264 only)
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
      seconds =
        parseFloat(parts[0]) * 3600 +
        parseFloat(parts[1]) * 60 +
        parseFloat(parts[2]);
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
      this.callbacks.onLog(
        `Video duration detected: ${durationMatch[1]} (${this.videoDuration}s)`,
        "metadata",
      );
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

  private categorizeLog(
    log: string,
  ): "info" | "success" | "warning" | "error" | "debug" | "metadata" {
    const lower = log.toLowerCase();

    // Errors
    if (
      lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("invalid")
    ) {
      return "error";
    }

    // Warnings
    if (
      lower.includes("warning") ||
      lower.includes("deprecated") ||
      (lower.includes("not found") && !lower.includes("glyph"))
    ) {
      return "warning";
    }

    // Success
    if (
      lower.includes("completed") ||
      lower.includes("success") ||
      lower.includes("done")
    ) {
      return "success";
    }

    // Metadata (codec info, stream info, etc.)
    if (
      lower.includes("stream") ||
      lower.includes("duration") ||
      lower.includes("encoder") ||
      lower.includes("bitrate") ||
      lower.includes("video:") ||
      lower.includes("audio:")
    ) {
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
      const percentage =
        this.videoDuration > 0
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
    settings: EncodingSettings = { bitrate: "2400k" },
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

    // Validate paths are safe for FFmpeg processing
    const videoValidation = validatePathForFFmpeg(videoPath);
    if (!videoValidation.isValid) {
      throw new Error(`Invalid video path: ${videoValidation.error}`);
    }
    const subtitleValidation = validatePathForFFmpeg(subtitlePath);
    if (!subtitleValidation.isValid) {
      throw new Error(`Invalid subtitle path: ${subtitleValidation.error}`);
    }
    const outputValidation = validatePathForFFmpeg(outputPath);
    if (!outputValidation.isValid) {
      throw new Error(`Invalid output path: ${outputValidation.error}`);
    }

    // Resolve output path to an absolute path and ensure directory exists
    let resolvedOutputPath = outputPath;
    try {
      if (!path.isAbsolute(resolvedOutputPath)) {
        const baseDir = path.dirname(videoPath);
        resolvedOutputPath = path.join(baseDir, resolvedOutputPath);
      }
      const outDir = path.dirname(resolvedOutputPath);
      fs.mkdirSync(outDir, { recursive: true });
      this.callbacks.onLog(
        `Resolved output path: ${resolvedOutputPath}`,
        "info",
      );
    } catch (e) {
      // Fallback to original outputPath if something went wrong
      this.callbacks.onLog(
        `Failed to ensure output directory: ${String(e)}`,
        "warning",
      );
    }

    this.outputPath = resolvedOutputPath;
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
    this.callbacks.onLog(`Output: ${this.outputPath}`, "info");
    // Normalize settings with safe defaults
    const normalized = this.normalizeSettings(settings);
    this.callbacks.onLog(
      `Quality: ${normalized.qualityMode ?? "vbr_hq"}${normalized.cq !== undefined ? ", CQ=" + normalized.cq : ""} | ` +
        `Encoder: ${normalized.codec ?? "h264"} ${normalized.hwEncoder ?? "auto"} | ` +
        `GPU Encode: ${normalized.gpuEncode ? "ON" : "OFF"} | GPU Decode: ${normalized.gpuDecode ? "ON" : "OFF"}`,
      "info",
    );

    // Escape subtitle path for FFmpeg's subtitles filter
    const escapedSubtitlePath = escapeSubtitlePath(subtitlePath);

    // Build FFmpeg arguments
    const args: string[] = [];

    // Hardware decode (must come before input) — default off for hard-subs
    if (normalized.gpuDecode) {
      if (normalized.hwEncoder === "nvenc" || normalized.hwEncoder === "amf") {
        args.push("-hwaccel", "d3d11va");
      } else if (normalized.hwEncoder === "qsv") {
        args.push("-hwaccel", "qsv");
      } else {
        args.push("-hwaccel", "d3d11va");
      }
      this.callbacks.onLog(`Hardware decode enabled`, "info");
    }

    // Input
    args.push("-i", videoPath);

    // Video filter chain: optional scale -> subtitles -> format
    const vfParts: string[] = [];
    if (
      typeof (settings as any).scaleWidth === "number" &&
      typeof (settings as any).scaleHeight === "number"
    ) {
      const w = (settings as any).scaleWidth;
      const h = (settings as any).scaleHeight;
      // Keep exact WxH; rely on libass to render in scaled frame; if AR differs, users can adjust later
      vfParts.push(`scale=${w}:${h}`);
    }
    vfParts.push(`subtitles='${escapedSubtitlePath}'`);
    if (normalized.gpuEncode) {
      vfParts.push("format=yuv420p");
    }
    args.push("-vf", vfParts.join(","));

    // Video codec and quality (H.264 only)
    if (normalized.gpuEncode) {
      // Hardware encoder choice (always H.264)
      const encoder =
        normalized.hwEncoder === "qsv"
          ? "h264_qsv"
          : normalized.hwEncoder === "amf"
            ? "h264_amf"
            : "h264_nvenc";
      args.push("-c:v", encoder);

      // Rate control
      const rc = normalized.qualityMode ?? "vbr_hq";
      if (rc) args.push("-rc:v", rc);
      if ((rc === "cq" || rc === "vbr_hq") && normalized.cq !== undefined) {
        args.push("-cq:v", String(normalized.cq));
      }
      if (normalized.preset) args.push("-preset", normalized.preset);
      args.push("-tune", "hq");
      if (normalized.spatialAQ) args.push("-spatial_aq", "1");
      if (normalized.temporalAQ) args.push("-temporal_aq", "1");
      if (typeof normalized.rcLookahead === "number")
        args.push("-rc-lookahead", String(normalized.rcLookahead));
      // For CQ-based VBR, allow unconstrained bitrate
      if (rc === "vbr_hq" || rc === "cq") {
        args.push("-b:v", "0");
      } else {
        args.push("-b:v", normalized.bitrate);
      }
    } else {
      // Software encoding (always H.264)
      args.push("-c:v", "libx264");
      args.push("-b:v", normalized.bitrate);
      args.push("-preset", "veryfast");
      args.push("-tune", "animation");
    }

    // Audio copy (no re-encoding)
    args.push("-c:a", "copy");

    // MP4 faststart and overwrite
    if (this.outputPath.toLowerCase().endsWith(".mp4")) {
      args.push("-movflags", "+faststart");
    }
    args.push("-y");

    // Output file
    args.push(this.outputPath);

    // Log pipeline summary
    this.callbacks.onLog(
      `Pipeline: subtitles filter is CPU (libass). This pipeline is CPU-bound for text render.`,
      "metadata",
    );
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
        const lines = output
          .split("\n")
          .filter(
            (line) =>
              line.trim() &&
              !line.includes("size=") &&
              !line.includes("frame="),
          );

        lines.forEach((line) => {
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
