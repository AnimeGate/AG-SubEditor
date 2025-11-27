import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HardDrive, AlertTriangle } from "lucide-react";

interface DiskSpaceInfo {
  available: number;
  total: number;
  driveLetter: string;
}

interface QueueItemForEstimate {
  videoPath: string;
  outputPath: string;
}

interface WypalarkaDiskSpaceBarProps {
  outputPath: string | null;
  videoPath: string | null;
  encodingSettings: {
    bitrate?: string;
    qualityMode?: string;
    cqValue?: number;
  };
  // Optional: queue items for calculating total size in queue mode
  queueItems?: QueueItemForEstimate[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (isNaN(bytes) || bytes < 0) return "Unknown";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

export function WypalarkaDiskSpaceBar({
  outputPath,
  videoPath,
  encodingSettings,
  queueItems,
}: WypalarkaDiskSpaceBarProps) {
  const { t } = useTranslation();
  const [diskSpace, setDiskSpace] = useState<DiskSpaceInfo | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileCount, setFileCount] = useState<number>(1);

  // Extract primitive values for stable dependencies
  const { bitrate, qualityMode, cqValue } = encodingSettings;

  // Check if we're in queue mode (multiple files)
  const isQueueMode = queueItems && queueItems.length > 0;

  // Create a stable key for queue items to prevent excessive re-renders
  const queueItemsKey = queueItems
    ? queueItems.map((i) => `${i.videoPath}|${i.outputPath}`).join(",")
    : "";

  // Fetch disk space when output path changes
  useEffect(() => {
    if (!outputPath) {
      setDiskSpace(null);
      return;
    }

    const fetchDiskSpace = async () => {
      try {
        const space = await window.ffmpegAPI.getDiskSpace(outputPath);
        setDiskSpace(space);
      } catch {
        setDiskSpace(null);
      }
    };

    fetchDiskSpace();

    // Refresh every 30 seconds while component is mounted and we have an output path
    const interval = setInterval(fetchDiskSpace, 30000);
    return () => clearInterval(interval);
  }, [outputPath]);

  // Estimate output size when video path or settings change
  // Use primitive values as dependencies to prevent unnecessary re-runs
  // In queue mode, calculate total for all pending items
  useEffect(() => {
    // Queue mode: calculate total for all items
    if (isQueueMode && queueItems.length > 0) {
      const estimateTotalSize = async () => {
        setIsLoading(true);
        try {
          let total = 0;
          for (const item of queueItems) {
            try {
              const result = await window.ffmpegAPI.checkDiskSpace(
                item.outputPath,
                item.videoPath,
                { bitrate, qualityMode, cqValue },
              );
              total += result.required;
            } catch {
              // Skip items that fail estimation
            }
          }
          setEstimatedSize(total);
          setFileCount(queueItems.length);
        } catch {
          setEstimatedSize(null);
        } finally {
          setIsLoading(false);
        }
      };

      estimateTotalSize();
      return;
    }

    // Single file mode
    if (!videoPath || !outputPath) {
      setEstimatedSize(null);
      setFileCount(1);
      return;
    }

    const estimateSize = async () => {
      setIsLoading(true);
      try {
        const result = await window.ffmpegAPI.checkDiskSpace(
          outputPath,
          videoPath,
          { bitrate, qualityMode, cqValue },
        );
        setEstimatedSize(result.required);
        setFileCount(1);
      } catch {
        setEstimatedSize(null);
      } finally {
        setIsLoading(false);
      }
    };

    estimateSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoPath, outputPath, bitrate, qualityMode, cqValue, isQueueMode, queueItemsKey]);

  // Determine if space is low (less than estimated + 1GB buffer)
  const isSpaceLow =
    diskSpace &&
    estimatedSize &&
    diskSpace.available < estimatedSize + 1024 * 1024 * 1024;

  const isSpaceCritical =
    diskSpace &&
    estimatedSize &&
    diskSpace.available < estimatedSize + 500 * 1024 * 1024;

  // Minimal state when no output selected
  if (!outputPath) {
    return (
      <div className="bg-card flex-shrink-0 border-t px-6 py-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <HardDrive className="h-4 w-4" />
          <span>{t("wypalarkaDiskSpaceSelectOutput")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card flex-shrink-0 border-t px-6 py-3">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        {/* Drive letter */}
        <div className="flex items-center gap-2">
          <HardDrive
            className={`h-4 w-4 ${isSpaceCritical ? "text-destructive" : isSpaceLow ? "text-yellow-500" : "text-primary"}`}
          />
          <span className="font-semibold">
            {diskSpace?.driveLetter || "..."}
          </span>
        </div>

        <div className="bg-border h-6 w-px" />

        {/* Available space */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {t("wypalarkaDiskSpaceAvailable")}:
          </span>
          <span
            className={`font-mono font-semibold ${isSpaceCritical ? "text-destructive" : isSpaceLow ? "text-yellow-500" : ""}`}
          >
            {diskSpace ? formatBytes(diskSpace.available) : "..."}
          </span>
        </div>

        {/* Estimated size (only when video selected or queue has items) */}
        {(videoPath || isQueueMode) && (
          <>
            <div className="bg-border h-6 w-px" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("wypalarkaDiskSpaceEstimated")}
                {isQueueMode && fileCount > 1 && ` (${fileCount})`}:
              </span>
              <span className="font-mono font-semibold">
                {isLoading
                  ? "..."
                  : estimatedSize
                    ? `~${formatBytes(estimatedSize)}`
                    : "-"}
              </span>
            </div>
          </>
        )}

        {/* Warning indicator */}
        {isSpaceLow && (
          <>
            <div className="bg-border h-6 w-px" />
            <div
              className={`flex items-center gap-1 ${isSpaceCritical ? "text-destructive" : "text-yellow-500"}`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("wypalarkaDiskSpaceLowWarning")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
