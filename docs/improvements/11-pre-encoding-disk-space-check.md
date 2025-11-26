# Pre-Encoding Disk Space Check

## Overview

Add a pre-flight check to verify sufficient disk space before starting encoding. Currently, FFmpeg will fail mid-encoding if disk space runs out, leaving a corrupted/incomplete output file.

## Current Behavior

**Problem:** No disk space validation before encoding starts.

**Failure Scenario:**
1. User starts encoding large video
2. FFmpeg writes output progressively
3. Disk fills up mid-encoding
4. FFmpeg fails with cryptic error
5. Incomplete/corrupted output file remains
6. User loses time and must manually clean up

## Proposed Solution

### Pre-Flight Check Flow

1. Before encoding starts, estimate required disk space
2. Check available space on output drive
3. If insufficient, warn user with options:
   - Cancel encoding
   - Choose different output location
   - Proceed anyway (at user's risk)

### Space Estimation Strategy

**Challenge:** Exact output size is unknown before encoding.

**Estimation Approaches:**

1. **Simple Ratio**: Assume output ≈ 50-150% of input video size
2. **Bitrate-Based**: Calculate from target bitrate × video duration
3. **Conservative**: Use MAX(input_size, bitrate_estimate) × safety_margin

**Recommended: Bitrate-Based with Safety Margin**

```
estimated_size = (target_bitrate_kbps / 8) × duration_seconds × 1024 × 1.1
                                                               └── 10% safety margin
```

### Implementation Steps

#### 1. Add Disk Space Check Utility

**File:** `src/lib/disk-space.ts`

```typescript
import { execSync } from "child_process";
import path from "path";

interface DiskSpaceInfo {
  available: number;  // bytes
  total: number;      // bytes
  free: number;       // bytes (same as available on most systems)
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
  // Get drive letter (e.g., "C:" from "C:\Users\...")
  const driveLetter = targetPath.substring(0, 2);

  try {
    // Use WMIC to get disk info
    const output = execSync(
      `wmic logicaldisk where "DeviceID='${driveLetter}'" get FreeSpace,Size /format:csv`,
      { encoding: "utf-8", timeout: 5000 }
    );

    const lines = output.trim().split("\n");
    const dataLine = lines[lines.length - 1]; // Last line has data
    const [, freeSpace, totalSize] = dataLine.split(",");

    const free = parseInt(freeSpace, 10);
    const total = parseInt(totalSize, 10);

    return {
      available: free,
      total: total,
      free: free,
    };
  } catch (error) {
    // Fallback: use PowerShell
    return getWindowsDiskSpacePowerShell(driveLetter);
  }
}

function getWindowsDiskSpacePowerShell(driveLetter: string): DiskSpaceInfo {
  const script = `(Get-PSDrive ${driveLetter.charAt(0)}).Free,(Get-PSDrive ${driveLetter.charAt(0)}).Used`;

  try {
    const output = execSync(`powershell -Command "${script}"`, {
      encoding: "utf-8",
      timeout: 5000,
    });

    const [free, used] = output.trim().split("\n").map(n => parseInt(n, 10));
    const total = free + used;

    return { available: free, total, free };
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
    const [, size, , available] = lines[1].split(/\s+/);

    return {
      available: parseInt(available, 10),
      total: parseInt(size, 10),
      free: parseInt(available, 10),
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
    bitrate?: string;  // e.g., "6000k" or "6M"
    rateControl?: string;
    cqValue?: number;
  }
): number {
  const durationSeconds = durationMs / 1000;

  // Parse bitrate string to bits per second
  let bitrateBps: number;

  if (settings.bitrate) {
    bitrateBps = parseBitrate(settings.bitrate);
  } else if (settings.rateControl === "cq" || settings.rateControl === "vbr_hq") {
    // Estimate based on CQ value (rough approximation)
    // CQ 18 ≈ 10-15 Mbps for 1080p, CQ 23 ≈ 5-8 Mbps, CQ 28 ≈ 2-4 Mbps
    const cq = settings.cqValue || 23;
    bitrateBps = estimateBitrateFromCQ(cq);
  } else {
    // Default assumption: 6 Mbps
    bitrateBps = 6_000_000;
  }

  // Calculate base size: (bitrate × duration) / 8
  const baseSize = (bitrateBps * durationSeconds) / 8;

  // Add audio (assume ~192 kbps, though it's copied)
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
  if (cq <= 18) return 15_000_000;      // ~15 Mbps
  if (cq <= 20) return 10_000_000;      // ~10 Mbps
  if (cq <= 23) return 6_000_000;       // ~6 Mbps
  if (cq <= 26) return 4_000_000;       // ~4 Mbps
  if (cq <= 28) return 3_000_000;       // ~3 Mbps
  return 2_000_000;                     // ~2 Mbps for higher CQ
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}
```

#### 2. Add IPC Channels

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts`

```typescript
CHECK_DISK_SPACE: "ffmpeg:check-disk-space",
GET_VIDEO_DURATION: "ffmpeg:get-video-duration",
```

#### 3. Add Main Process Listeners

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts`

```typescript
import { getDiskSpace, estimateOutputSize, formatBytes } from "@/lib/disk-space";
import { getVideoDuration } from "@/lib/ffmpeg-processor";

ipcMain.handle(
  FFMPEG_CHANNELS.CHECK_DISK_SPACE,
  async (
    _,
    outputPath: string,
    videoPath: string,
    settings: EncodingSettings
  ): Promise<{
    sufficient: boolean;
    available: number;
    required: number;
    availableFormatted: string;
    requiredFormatted: string;
  }> => {
    try {
      // Get output directory (file might not exist yet)
      const outputDir = path.dirname(outputPath);

      // Get disk space
      const spaceInfo = await getDiskSpace(outputDir);

      // Get video duration
      const duration = await getVideoDuration(videoPath);

      // Estimate required space
      const requiredSpace = estimateOutputSize(duration, settings);

      // Check if sufficient (with 500MB minimum buffer)
      const minimumBuffer = 500 * 1024 * 1024; // 500 MB
      const sufficient = spaceInfo.available >= requiredSpace + minimumBuffer;

      return {
        sufficient,
        available: spaceInfo.available,
        required: requiredSpace,
        availableFormatted: formatBytes(spaceInfo.available),
        requiredFormatted: formatBytes(requiredSpace),
      };
    } catch (error) {
      // If check fails, allow encoding to proceed (don't block on check failure)
      debugLog.warn(`Disk space check failed: ${error}`);
      return {
        sufficient: true, // Optimistic fallback
        available: 0,
        required: 0,
        availableFormatted: "Unknown",
        requiredFormatted: "Unknown",
      };
    }
  }
);
```

#### 4. Add Video Duration Helper

**File:** `src/lib/ffmpeg-processor.ts`

```typescript
/**
 * Get video duration in milliseconds using FFprobe.
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobePath = getFFprobePath(); // Same directory as FFmpeg

    const process = spawn(ffprobePath, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);

    let output = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        const durationSeconds = parseFloat(output.trim());
        resolve(durationSeconds * 1000);
      } else {
        reject(new Error("Failed to get video duration"));
      }
    });

    process.on("error", reject);

    // Timeout after 10 seconds
    setTimeout(() => {
      process.kill();
      reject(new Error("Duration check timed out"));
    }, 10000);
  });
}

function getFFprobePath(): string {
  const ffmpegDir = path.dirname(getFFmpegPath());
  return path.join(ffmpegDir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
}
```

#### 5. Add Context Exposure

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-context.ts`

```typescript
checkDiskSpace: (
  outputPath: string,
  videoPath: string,
  settings: EncodingSettings
): Promise<{
  sufficient: boolean;
  available: number;
  required: number;
  availableFormatted: string;
  requiredFormatted: string;
}> => ipcRenderer.invoke(FFMPEG_CHANNELS.CHECK_DISK_SPACE, outputPath, videoPath, settings),
```

#### 6. Create Disk Space Warning Dialog

**File:** `src/components/wypalarka/WypalarkaDiskSpaceDialog.tsx`

```typescript
interface DiskSpaceDialogProps {
  open: boolean;
  available: string;
  required: string;
  outputPath: string;
  onProceed: () => void;
  onChangeLocation: () => void;
  onCancel: () => void;
}

export function WypalarkaDiskSpaceDialog({
  open,
  available,
  required,
  outputPath,
  onProceed,
  onChangeLocation,
  onCancel,
}: DiskSpaceDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t("wypalarka.diskSpace.title")}
          </DialogTitle>
          <DialogDescription>
            {t("wypalarka.diskSpace.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("wypalarka.diskSpace.required")}
              </p>
              <p className="text-lg font-semibold">{required}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("wypalarka.diskSpace.available")}
              </p>
              <p className="text-lg font-semibold text-destructive">{available}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">
              {t("wypalarka.diskSpace.outputLocation")}
            </p>
            <p className="font-mono text-xs truncate">{outputPath}</p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("wypalarka.diskSpace.warning")}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button variant="secondary" onClick={onChangeLocation}>
            <FolderOpen className="h-4 w-4 mr-2" />
            {t("wypalarka.diskSpace.changeLocation")}
          </Button>
          <Button variant="destructive" onClick={onProceed}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t("wypalarka.diskSpace.proceedAnyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 7. Integrate into Encoding Flow

**File:** `src/components/wypalarka/Wypalarka.tsx`

```typescript
const [diskSpaceDialog, setDiskSpaceDialog] = useState<{
  open: boolean;
  available: string;
  required: string;
} | null>(null);

const handleStartProcess = async () => {
  // Step 1: Check disk space
  const spaceCheck = await window.ffmpegAPI.checkDiskSpace(
    outputPath,
    videoPath,
    encodingSettings
  );

  if (!spaceCheck.sufficient) {
    setDiskSpaceDialog({
      open: true,
      available: spaceCheck.availableFormatted,
      required: spaceCheck.requiredFormatted,
    });
    return; // Wait for user decision
  }

  // Step 2: Check file conflicts (from improvement #1)
  // ...

  // Step 3: Start encoding
  startEncoding();
};

const handleDiskSpaceProceed = () => {
  setDiskSpaceDialog(null);
  startEncoding(); // User accepted the risk
};

const handleDiskSpaceChangeLocation = async () => {
  setDiskSpaceDialog(null);

  // Open save dialog for new location
  const newPath = await window.ffmpegAPI.selectOutputPath();
  if (newPath) {
    setOutputPath(newPath);
    // Re-trigger start which will re-check disk space
    handleStartProcess();
  }
};

// In JSX
{diskSpaceDialog && (
  <WypalarkaDiskSpaceDialog
    open={diskSpaceDialog.open}
    available={diskSpaceDialog.available}
    required={diskSpaceDialog.required}
    outputPath={outputPath}
    onProceed={handleDiskSpaceProceed}
    onChangeLocation={handleDiskSpaceChangeLocation}
    onCancel={() => setDiskSpaceDialog(null)}
  />
)}
```

#### 8. Queue Pre-Flight Check

**File:** `src/lib/queue-processor.ts`

Add disk space check to queue pre-processing:

```typescript
async function preflightCheck(items: QueueItem[]): Promise<{
  passed: boolean;
  issues: Array<{ itemId: string; issue: string }>;
}> {
  const issues: Array<{ itemId: string; issue: string }> = [];

  for (const item of items) {
    // Check disk space for each unique output directory
    const spaceCheck = await checkDiskSpace(item.outputPath, item.videoPath);

    if (!spaceCheck.sufficient) {
      issues.push({
        itemId: item.id,
        issue: `Insufficient disk space: need ${spaceCheck.requiredFormatted}, have ${spaceCheck.availableFormatted}`,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
```

### Translations

**File:** `src/localization/i18n.ts`

```typescript
// Polish
wypalarka: {
  diskSpace: {
    title: "Niewystarczająca ilość miejsca na dysku",
    description: "Na dysku docelowym może nie być wystarczającej ilości miejsca dla pliku wyjściowego.",
    required: "Wymagane (szacunkowo)",
    available: "Dostępne",
    outputLocation: "Lokalizacja wyjściowa",
    warning: "Kontynuowanie może spowodować uszkodzenie pliku wyjściowego, jeśli zabraknie miejsca podczas kodowania.",
    changeLocation: "Zmień lokalizację",
    proceedAnyway: "Kontynuuj mimo to",
  },
},

// English
wypalarka: {
  diskSpace: {
    title: "Insufficient disk space",
    description: "The target drive may not have enough space for the output file.",
    required: "Required (estimated)",
    available: "Available",
    outputLocation: "Output location",
    warning: "Proceeding may result in a corrupted output file if disk space runs out during encoding.",
    changeLocation: "Change location",
    proceedAnyway: "Proceed anyway",
  },
},
```

## Edge Cases

1. **Network drives**: May report incorrect space or fail - handle gracefully
2. **Very large files**: Estimation may be off for 4K+ content - increase safety margin
3. **Multiple outputs to same drive**: Sum all required space for queue
4. **Permission issues**: Can't check space - proceed with warning
5. **SSD with TRIM**: Available space may change rapidly - snapshot only

## Testing Checklist

- [ ] Single file: sufficient space, no warning shown
- [ ] Single file: insufficient space, warning dialog appears
- [ ] Single file: proceed anyway starts encoding
- [ ] Single file: change location opens dialog
- [ ] Queue: pre-flight detects space issues for multiple items
- [ ] Network drive: handles check failure gracefully
- [ ] Very short video: estimation doesn't underestimate
- [ ] Very long video: estimation reasonable
- [ ] CQ mode: estimation works without explicit bitrate
- [ ] VBR mode: estimation uses target bitrate

## Files to Create/Modify

1. `src/lib/disk-space.ts` - New utility file
2. `src/lib/ffmpeg-processor.ts` - Add duration helper
3. `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts` - Add channels
4. `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts` - Add handlers
5. `src/helpers/ipc/ffmpeg/ffmpeg-context.ts` - Expose to renderer
6. `src/components/wypalarka/WypalarkaDiskSpaceDialog.tsx` - New component
7. `src/components/wypalarka/Wypalarka.tsx` - Integrate check
8. `src/lib/queue-processor.ts` - Add queue pre-flight
9. `src/localization/i18n.ts` - Add translations
10. `src/types.d.ts` - Update FFmpegAPI interface
