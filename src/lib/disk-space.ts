import { execSync } from "child_process";
import path from "path";

export interface DiskSpaceInfo {
  available: number; // bytes
  total: number; // bytes
  driveLetter: string; // e.g., "D:" on Windows
}

export interface DiskSpaceCheckResult {
  sufficient: boolean;
  available: number;
  required: number;
  availableFormatted: string;
  requiredFormatted: string;
  driveLetter: string;
}

/**
 * Get available disk space for a given path.
 * Works on Windows, macOS, and Linux.
 */
export async function getDiskSpace(targetPath: string): Promise<DiskSpaceInfo> {
  const normalizedPath = path.resolve(targetPath);

  if (process.platform === "win32") {
    return getWindowsDiskSpace(normalizedPath);
  } else {
    return getUnixDiskSpace(normalizedPath);
  }
}

function getWindowsDiskSpace(targetPath: string): DiskSpaceInfo {
  // Get drive letter (e.g., "D:" from "D:\Videos\...")
  const driveLetter = targetPath.substring(0, 2).toUpperCase();

  try {
    // Use WMIC to get disk info
    const output = execSync(
      `wmic logicaldisk where "DeviceID='${driveLetter}'" get FreeSpace,Size /format:csv`,
      { encoding: "utf-8", timeout: 5000 },
    );

    const lines = output.trim().split("\n");
    const dataLine = lines[lines.length - 1]; // Last line has data
    const [, freeSpace, totalSize] = dataLine.split(",");

    const free = parseInt(freeSpace, 10);
    const total = parseInt(totalSize, 10);

    return {
      available: free,
      total: total,
      driveLetter,
    };
  } catch {
    // Fallback: use PowerShell
    return getWindowsDiskSpacePowerShell(driveLetter);
  }
}

function getWindowsDiskSpacePowerShell(driveLetter: string): DiskSpaceInfo {
  const driveChar = driveLetter.charAt(0);
  const script = `(Get-PSDrive ${driveChar}).Free,(Get-PSDrive ${driveChar}).Used`;

  try {
    const output = execSync(`powershell -Command "${script}"`, {
      encoding: "utf-8",
      timeout: 5000,
    });

    const [free, used] = output
      .trim()
      .split("\n")
      .map((n) => parseInt(n, 10));
    const total = free + used;

    return { available: free, total, driveLetter };
  } catch {
    throw new Error(`Failed to get disk space for ${driveLetter}`);
  }
}

function getUnixDiskSpace(targetPath: string): DiskSpaceInfo {
  try {
    const output = execSync(`df -B1 "${targetPath}"`, {
      encoding: "utf-8",
      timeout: 5000,
    });

    const lines = output.trim().split("\n");
    const parts = lines[1].split(/\s+/);
    const [filesystem, size, , available] = parts;

    return {
      available: parseInt(available, 10),
      total: parseInt(size, 10),
      driveLetter: filesystem,
    };
  } catch {
    throw new Error(`Failed to get disk space for ${targetPath}`);
  }
}

/**
 * Estimate output file size based on encoding settings.
 */
export function estimateOutputSize(
  durationMs: number,
  settings: {
    bitrate?: string; // e.g., "6000k" or "6M"
    qualityMode?: string;
    cqValue?: number;
  },
): number {
  const durationSeconds = durationMs / 1000;

  // Parse bitrate string to bits per second
  let bitrateBps: number;

  if (settings.bitrate) {
    bitrateBps = parseBitrate(settings.bitrate);
  } else if (
    settings.qualityMode === "cq" ||
    settings.qualityMode === "vbr_hq"
  ) {
    // Estimate based on CQ value (rough approximation)
    const cq = settings.cqValue || 23;
    bitrateBps = estimateBitrateFromCQ(cq);
  } else {
    // Default assumption: 6 Mbps
    bitrateBps = 6_000_000;
  }

  // Calculate base size: (bitrate x duration) / 8
  const baseSize = (bitrateBps * durationSeconds) / 8;

  // Add audio (assume ~192 kbps, though it's usually copied)
  const audioSize = (192_000 * durationSeconds) / 8;

  // Add 15% safety margin for container overhead, variable bitrate peaks, etc.
  const safetyMargin = 1.15;

  return Math.ceil((baseSize + audioSize) * safetyMargin);
}

function parseBitrate(bitrateStr: string): number {
  const match = bitrateStr.match(/^(\d+(?:\.\d+)?)\s*([kKmM])?$/);
  if (!match) return 6_000_000; // Default 6 Mbps

  const value = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();

  switch (unit) {
    case "k":
      return value * 1000;
    case "m":
      return value * 1_000_000;
    default:
      return value;
  }
}

function estimateBitrateFromCQ(cq: number): number {
  // Very rough estimation based on typical 1080p content
  // CQ is logarithmic; lower = higher quality/bitrate
  if (cq <= 18) return 15_000_000; // ~15 Mbps
  if (cq <= 20) return 10_000_000; // ~10 Mbps
  if (cq <= 23) return 6_000_000; // ~6 Mbps
  if (cq <= 26) return 4_000_000; // ~4 Mbps
  if (cq <= 28) return 3_000_000; // ~3 Mbps
  return 2_000_000; // ~2 Mbps for higher CQ
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (isNaN(bytes) || bytes < 0) return "Unknown";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Get drive letter from a path (Windows only).
 */
export function getDriveLetter(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.substring(0, 2).toUpperCase();
  }
  return "/";
}
