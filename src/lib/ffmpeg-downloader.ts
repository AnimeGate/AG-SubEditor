import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { spawn } from "child_process";

// FFmpeg static build from BtbN/FFmpeg-Builds (reliable source with Windows builds)
const FFMPEG_DOWNLOAD_URL =
  "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip";

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  status: "downloading" | "extracting" | "complete" | "error";
  message?: string;
}

export class FFmpegDownloader {
  private onProgress?: (progress: DownloadProgress) => void;

  constructor(options?: { onProgress?: (progress: DownloadProgress) => void }) {
    this.onProgress = options?.onProgress;
  }

  /**
   * Get the path where FFmpeg should be located
   */
  static getFfmpegPath(): string {
    const userDataPath = app.getPath("userData");
    const ffmpegDir = path.join(userDataPath, "WYPALANIE");
    return path.join(ffmpegDir, "ffmpeg.exe");
  }

  /**
   * Get the directory where FFmpeg should be located
   */
  static getFfmpegDir(): string {
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "WYPALANIE");
  }

  /**
   * Check if FFmpeg is already installed
   */
  static isInstalled(): boolean {
    const ffmpegPath = FFmpegDownloader.getFfmpegPath();
    return fs.existsSync(ffmpegPath);
  }

  /**
   * Download and install FFmpeg
   */
  async downloadAndInstall(): Promise<void> {
    const ffmpegDir = FFmpegDownloader.getFfmpegDir();
    const zipPath = path.join(ffmpegDir, "ffmpeg.zip");

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(ffmpegDir)) {
        fs.mkdirSync(ffmpegDir, { recursive: true });
      }

      // Download FFmpeg
      this.emitProgress({
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 0,
        status: "downloading",
        message: "Starting download...",
      });

      await this.downloadFile(FFMPEG_DOWNLOAD_URL, zipPath);

      // Extract FFmpeg
      this.emitProgress({
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 50,
        status: "extracting",
        message: "Extracting FFmpeg...",
      });

      await this.extractZip(zipPath, ffmpegDir);

      // Move ffmpeg.exe from extracted folder to WYPALANIE root
      await this.moveFfmpegExecutable(ffmpegDir);

      // Clean up
      fs.unlinkSync(zipPath);

      this.emitProgress({
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 100,
        status: "complete",
        message: "FFmpeg installed successfully!",
      });
    } catch (error) {
      this.emitProgress({
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 0,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Download a file from URL
   */
  private downloadFile(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      let downloadedBytes = 0;
      let totalBytes = 0;

      https
        .get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              file.close();
              fs.unlinkSync(destination);
              this.downloadFile(redirectUrl, destination).then(resolve).catch(reject);
              return;
            }
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          totalBytes = parseInt(response.headers["content-length"] || "0", 10);

          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;
            const percentage = totalBytes > 0 ? (downloadedBytes / totalBytes) * 50 : 0; // 50% for download

            this.emitProgress({
              downloadedBytes,
              totalBytes,
              percentage,
              status: "downloading",
              message: `Downloading: ${this.formatBytes(downloadedBytes)} / ${this.formatBytes(totalBytes)}`,
            });
          });

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlinkSync(destination);
          reject(err);
        });

      file.on("error", (err) => {
        fs.unlinkSync(destination);
        reject(err);
      });
    });
  }

  /**
   * Extract a zip file using PowerShell's Expand-Archive
   */
  private extractZip(zipPath: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempExtractDir = path.join(destination, "temp_extract");

      // Use PowerShell to extract (available on all modern Windows)
      const powershellCommand = `Expand-Archive -Path "${zipPath}" -DestinationPath "${tempExtractDir}" -Force`;

      const process = spawn("powershell.exe", ["-Command", powershellCommand], {
        windowsHide: true,
      });

      let errorOutput = "";

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to extract zip: ${errorOutput}`));
        }
      });

      process.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Move ffmpeg.exe from the extracted nested directory to WYPALANIE root
   */
  private async moveFfmpegExecutable(ffmpegDir: string): Promise<void> {
    const tempExtractDir = path.join(ffmpegDir, "temp_extract");

    // Find ffmpeg.exe in the extracted directory structure
    const ffmpegExe = this.findFfmpegExecutable(tempExtractDir);

    if (!ffmpegExe) {
      throw new Error("Could not find ffmpeg.exe in the extracted archive");
    }

    // Move to WYPALANIE root
    const targetPath = path.join(ffmpegDir, "ffmpeg.exe");
    fs.copyFileSync(ffmpegExe, targetPath);

    // Clean up temp directory
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  }

  /**
   * Recursively find ffmpeg.exe in a directory
   */
  private findFfmpegExecutable(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = this.findFfmpegExecutable(fullPath);
        if (found) return found;
      } else if (entry.name === "ffmpeg.exe") {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * Emit progress update
   */
  private emitProgress(progress: DownloadProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
