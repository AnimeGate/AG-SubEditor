import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  WypalarkaFileInput,
  type WypalarkaFileInputHandle,
} from "./WypalarkaFileInput";
import { WypalarkaProgressPanel } from "./WypalarkaProgressPanel";
import { WypalarkaQueuePanel } from "./WypalarkaQueuePanel";
import { WypalarkaQueueProgressPanel } from "./WypalarkaQueueProgressPanel";
import { WypalarkaSettingsModal } from "./WypalarkaSettingsModal";
import { WypalarkaFfmpegDownloadDialog } from "./WypalarkaFfmpegDownloadDialog";
import { WypalarkaDiskSpaceBar } from "./WypalarkaDiskSpaceBar";
import { WypalarkaDiskSpaceDialog } from "./WypalarkaDiskSpaceDialog";
import { WypalarkaQueueDiskSpaceDialog } from "./WypalarkaQueueDiskSpaceDialog";
import {
  WypalarkaQueueConflictDialog,
  type QueueConflict,
} from "./WypalarkaQueueConflictDialog";
import type { EncodingSettings } from "./WypalarkaSettings";
import { useTranslation } from "react-i18next";
import { Flame, FolderOpen, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { debugLog } from "@/helpers/debug-logger";
import { useProcessing } from "@/contexts/ProcessingContext";

type ProcessStatus = "idle" | "processing" | "completed" | "error";

interface LogEntry {
  log: string;
  type: LogType;
}

export default function Wypalarka() {
  const { t } = useTranslation();
  const { setIsProcessing } = useProcessing();

  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<FFmpegProgress | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [singleFileReady, setSingleFileReady] = useState(false);
  const fileInputRef = useRef<WypalarkaFileInputHandle>(null);
  const [completedOutputPath, setCompletedOutputPath] = useState<string | null>(
    null,
  );
  const [encodingSettings, setEncodingSettings] = useState<EncodingSettings>({
    profile: "1080p",
    qualityPreset: "medium",
    customBitrate: "2400k",
    useHardwareAccel: true,
    codec: "h264",
    preset: "p4",
    qualityMode: "vbr",
    cq: 19,
    spatialAQ: true,
    temporalAQ: true,
    rcLookahead: 20,
  });
  const [gpuAvailable, setGpuAvailable] = useState<boolean | undefined>(
    undefined,
  );
  const [gpuInfo, setGpuInfo] = useState<string>("");
  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Disk space tracking for footer bar
  const [currentVideoPath, setCurrentVideoPath] = useState<string | null>(null);
  const [currentOutputPath, setCurrentOutputPath] = useState<string | null>(null);

  // Disk space dialog state (single file mode)
  const [diskSpaceDialogOpen, setDiskSpaceDialogOpen] = useState(false);
  const [diskSpaceCheckResult, setDiskSpaceCheckResult] = useState<{
    availableFormatted: string;
    requiredFormatted: string;
    driveLetter: string;
    outputPath: string;
    pendingProcess: {
      videoPath: string;
      subtitlePath: string;
      outputPath: string;
    } | null;
  } | null>(null);

  // Queue disk space check state
  const [queueDiskSpaceDialogOpen, setQueueDiskSpaceDialogOpen] = useState(false);
  const [queueDiskSpaceIssues, setQueueDiskSpaceIssues] = useState<
    Array<{
      videoName: string;
      driveLetter: string;
      availableFormatted: string;
      requiredFormatted: string;
    }>
  >([]);

  // Queue output conflict state
  const [queueConflictDialogOpen, setQueueConflictDialogOpen] = useState(false);
  const [queueConflicts, setQueueConflicts] = useState<QueueConflict[]>([]);

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    error: 0,
    cancelled: 0,
  });
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);

  // Sync processing state to context (for navbar locking)
  useEffect(() => {
    const isAnyProcessing = status === "processing" || isQueueProcessing;
    setIsProcessing(isAnyProcessing);
  }, [status, isQueueProcessing, setIsProcessing]);

  // Check FFmpeg installation on mount
  useEffect(() => {
    const checkFfmpeg = async () => {
      try {
        const result = await window.ffmpegAPI.checkInstalled();
        setFfmpegInstalled(result.installed);
        if (!result.installed) {
          setShowDownloadDialog(true);
        }
      } catch (error) {
        setFfmpegInstalled(false);
        setShowDownloadDialog(true);
      }
    };
    checkFfmpeg();
  }, []);

  // Check GPU availability when FFmpeg is installed
  useEffect(() => {
    if (ffmpegInstalled) {
      const checkGpu = async () => {
        try {
          const result = await window.ffmpegAPI.checkGpu();
          setGpuAvailable(result.available);
          setGpuInfo(result.info);
        } catch (error) {
          setGpuAvailable(false);
          setGpuInfo("Error checking GPU");
        }
      };
      checkGpu();
    }
  }, [ffmpegInstalled]);

  // Set up event listeners
  useEffect(() => {
    // Single file mode listeners
    const unsubProgress = window.ffmpegAPI.onProgress((progress) => {
      setProgress(progress);
    });

    const unsubLog = window.ffmpegAPI.onLog((data) => {
      setLogs((prev) => [...prev, { log: data.log, type: data.type }]);
    });

    const unsubComplete = window.ffmpegAPI.onComplete((outputPath) => {
      setStatus("completed");
      setCompletedOutputPath(outputPath);
      setLogs((prev) => [
        ...prev,
        { log: `✓ Process completed successfully!`, type: "success" },
        { log: `Output: ${outputPath}`, type: "info" },
      ]);
    });

    const unsubError = window.ffmpegAPI.onError((error) => {
      setStatus("error");
      setErrorMessage(error);
      setLogs((prev) => [...prev, { log: `✗ Error: ${error}`, type: "error" }]);
    });

    // Queue listeners
    const unsubQueueUpdate = window.ffmpegAPI.onQueueUpdate((updatedQueue) => {
      setQueue(updatedQueue);
    });

    const unsubQueueItemUpdate = window.ffmpegAPI.onQueueItemUpdate((item) => {
      setQueue((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    });

    const unsubQueueComplete = window.ffmpegAPI.onQueueComplete(() => {
      setIsQueueProcessing(false);
    });

    return () => {
      unsubProgress();
      unsubLog();
      unsubComplete();
      unsubError();
      unsubQueueUpdate();
      unsubQueueItemUpdate();
      unsubQueueComplete();
    };
  }, []);

  // Update queue stats when queue changes
  useEffect(() => {
    const updateStats = async () => {
      const stats = await window.ffmpegAPI.queueGetStats();
      setQueueStats(stats);
      setIsQueueProcessing(stats.processing > 0);
    };
    updateStats();
  }, [queue]);

  // Update disk space bar paths based on queue items (for queue mode)
  useEffect(() => {
    // Only update paths for queue mode - check if we have pending items
    const pendingItems = queue.filter((item) => item.status === "pending");

    if (pendingItems.length > 0) {
      // Use the first pending item for disk space display (drive letter)
      setCurrentVideoPath(pendingItems[0].videoPath);
      setCurrentOutputPath(pendingItems[0].outputPath);
    } else if (queue.length === 0) {
      // Queue is empty - clear the paths (only if not in single file mode)
      // We check by seeing if current paths match any queue item that existed
      setCurrentVideoPath(null);
      setCurrentOutputPath(null);
    }
  }, [queue]);

  // Sync encoding settings changes with queue processor
  useEffect(() => {
    const syncSettings = async () => {
      const bitrate =
        encodingSettings.qualityPreset === "custom"
          ? encodingSettings.customBitrate
          : encodingSettings.customBitrate;

      try {
        await window.ffmpegAPI.queueUpdateSettings({
          bitrate,
          useHardwareAccel: encodingSettings.useHardwareAccel,
          gpuEncode: encodingSettings.useHardwareAccel,
          codec: encodingSettings.codec,
          preset: encodingSettings.preset,
          qualityMode: encodingSettings.qualityMode,
          cq: encodingSettings.cq,
          spatialAQ: encodingSettings.spatialAQ,
          temporalAQ: encodingSettings.temporalAQ,
          rcLookahead: encodingSettings.rcLookahead,
          // pass optional scale hints (main process ignores if undefined)
          scaleWidth: encodingSettings.scaleWidth,
          scaleHeight: encodingSettings.scaleHeight,
        });
      } catch (error) {
        console.error("Failed to sync settings with queue processor:", error);
      }
    };

    syncSettings();
  }, [encodingSettings]);

  // Actually start the FFmpeg process (called after disk space check passes or user proceeds anyway)
  const doStartProcess = async (
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
  ) => {
    try {
      setStatus("processing");
      setLogs([]);
      setProgress(null);
      setErrorMessage(undefined);

      // Get bitrate from settings
      const bitrate =
        encodingSettings.qualityPreset === "custom"
          ? encodingSettings.customBitrate
          : encodingSettings.customBitrate;

      await window.ffmpegAPI.startProcess({
        videoPath,
        subtitlePath,
        outputPath,
        settings: {
          bitrate,
          useHardwareAccel: encodingSettings.useHardwareAccel,
          gpuEncode: encodingSettings.useHardwareAccel,
          codec: encodingSettings.codec,
          preset: encodingSettings.preset,
          qualityMode: encodingSettings.qualityMode,
          cq: encodingSettings.cq,
          spatialAQ: encodingSettings.spatialAQ,
          temporalAQ: encodingSettings.temporalAQ,
          rcLookahead: encodingSettings.rcLookahead,
          scaleWidth: encodingSettings.scaleWidth,
          scaleHeight: encodingSettings.scaleHeight,
        },
      });
    } catch (error) {
      setStatus("error");
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMsg);
      setLogs((prev) => [
        ...prev,
        { log: `✗ Failed to start process: ${errorMsg}`, type: "error" },
      ]);
    }
  };

  // Entry point when user clicks start - checks disk space first
  const handleStartProcess = async (
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
  ) => {
    try {
      // Check disk space before starting
      const bitrate =
        encodingSettings.qualityPreset === "custom"
          ? encodingSettings.customBitrate
          : encodingSettings.customBitrate;

      const diskCheck = await window.ffmpegAPI.checkDiskSpace(
        outputPath,
        videoPath,
        {
          bitrate,
          qualityMode: encodingSettings.qualityMode,
          cqValue: encodingSettings.cq,
        },
      );

      if (!diskCheck.sufficient) {
        // Show warning dialog
        debugLog.warn(
          `Insufficient disk space: ${diskCheck.availableFormatted} available, ${diskCheck.requiredFormatted} required`,
        );
        setDiskSpaceCheckResult({
          availableFormatted: diskCheck.availableFormatted,
          requiredFormatted: diskCheck.requiredFormatted,
          driveLetter: diskCheck.driveLetter,
          outputPath,
          pendingProcess: { videoPath, subtitlePath, outputPath },
        });
        setDiskSpaceDialogOpen(true);
        return;
      }

      // Disk space is sufficient, proceed with encoding
      await doStartProcess(videoPath, subtitlePath, outputPath);
    } catch (error) {
      // If disk space check fails, proceed anyway (fail gracefully)
      debugLog.warn(`Disk space check failed, proceeding anyway: ${error}`);
      await doStartProcess(videoPath, subtitlePath, outputPath);
    }
  };

  const handleCancelProcess = async () => {
    try {
      await window.ffmpegAPI.cancelProcess();
      setStatus("idle");
      setLogs((prev) => [
        ...prev,
        { log: "Process cancelled by user", type: "warning" },
      ]);
    } catch (error) {
      console.error("Failed to cancel process:", error);
    }
  };

  // Handler for single file start button (triggers the file input's conflict check and start)
  const handleSingleFileStart = () => {
    fileInputRef.current?.startProcess();
  };

  const handleReset = () => {
    setStatus("idle");
    setLogs([]);
    setProgress(null);
    setErrorMessage(undefined);
    setCompletedOutputPath(null);
  };

  // Disk space dialog handlers
  const handleDiskSpaceProceed = async () => {
    setDiskSpaceDialogOpen(false);
    if (diskSpaceCheckResult?.pendingProcess) {
      const { videoPath, subtitlePath, outputPath } =
        diskSpaceCheckResult.pendingProcess;
      debugLog.warn(`User proceeding despite low disk space`);
      await doStartProcess(videoPath, subtitlePath, outputPath);
    }
    setDiskSpaceCheckResult(null);
  };

  const handleDiskSpaceChangeLocation = async () => {
    setDiskSpaceDialogOpen(false);
    // Let user select a new output location
    if (diskSpaceCheckResult?.outputPath) {
      const result = await window.ffmpegAPI.selectOutputPath(
        diskSpaceCheckResult.outputPath,
      );
      if (result && diskSpaceCheckResult.pendingProcess) {
        const { videoPath, subtitlePath } = diskSpaceCheckResult.pendingProcess;
        debugLog.file(`User changed output to: ${result}`);
        // Re-trigger the start process with new output path (will check disk space again)
        setDiskSpaceCheckResult(null);
        await handleStartProcess(videoPath, subtitlePath, result);
      } else {
        setDiskSpaceCheckResult(null);
      }
    }
  };

  const handleDiskSpaceCancel = () => {
    setDiskSpaceDialogOpen(false);
    setDiskSpaceCheckResult(null);
    debugLog.info(`User cancelled due to low disk space`);
  };

  // Queue disk space dialog handlers
  const handleQueueDiskSpaceProceed = async () => {
    setQueueDiskSpaceDialogOpen(false);
    setQueueDiskSpaceIssues([]);
    debugLog.warn(`User proceeding with queue despite low disk space warnings`);
    await doStartQueue();
  };

  const handleQueueDiskSpaceCancel = () => {
    setQueueDiskSpaceDialogOpen(false);
    setQueueDiskSpaceIssues([]);
    debugLog.info(`User cancelled queue start due to low disk space`);
  };

  const handleOpenOutputFolder = async () => {
    if (completedOutputPath) {
      try {
        await window.ffmpegAPI.openOutputFolder(completedOutputPath);
      } catch (error) {
        console.error("Failed to open output folder:", error);
      }
    }
  };

  const handleDownloadDialogClose = async () => {
    setShowDownloadDialog(false);
    // Re-check FFmpeg installation after dialog closes
    try {
      const result = await window.ffmpegAPI.checkInstalled();
      setFfmpegInstalled(result.installed);
    } catch (error) {
      setFfmpegInstalled(false);
    }
  };

  // Queue handlers
  const handleAddFilesToQueue = async (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => {
    try {
      debugLog.queue(`Adding ${files.length} items to queue`);
      // Settings are automatically synced via useEffect, just add items
      await window.ffmpegAPI.queueAddItems(files);
    } catch (error) {
      console.error("Failed to add files to queue:", error);
      debugLog.error(`Failed to add files to queue: ${error}`);
    }
  };

  const handleRemoveFromQueue = async (id: string) => {
    try {
      await window.ffmpegAPI.queueRemoveItem(id);
    } catch (error) {
      console.error("Failed to remove item from queue:", error);
    }
  };

  const handleClearQueue = async () => {
    try {
      await window.ffmpegAPI.queueClear();
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  };

  // Actually start the queue (after disk space checks pass or user proceeds anyway)
  const doStartQueue = async () => {
    try {
      debugLog.queue("Starting queue processing");
      setIsQueueProcessing(true);
      await window.ffmpegAPI.queueStart();
    } catch (error) {
      setIsQueueProcessing(false);
      console.error("Failed to start queue:", error);
      debugLog.error(`Failed to start queue: ${error}`);
    }
  };

  // Check for output file conflicts before starting queue
  const checkQueueConflicts = async (
    pendingItems: QueueItem[],
  ): Promise<QueueConflict[]> => {
    const conflicts: QueueConflict[] = [];

    for (const item of pendingItems) {
      try {
        const exists = await window.ffmpegAPI.checkOutputExists(item.outputPath);
        if (exists) {
          conflicts.push({
            itemId: item.id,
            videoName: item.videoName,
            outputPath: item.outputPath,
          });
        }
      } catch (error) {
        debugLog.warn(`Output check failed for ${item.videoName}: ${error}`);
      }
    }

    return conflicts;
  };

  // Entry point when user clicks start queue - checks conflicts and disk space first
  const handleStartQueue = async () => {
    try {
      // Get pending items from queue
      const pendingItems = queue.filter((item) => item.status === "pending");

      if (pendingItems.length === 0) {
        debugLog.queue("No pending items to process");
        return;
      }

      // Check for output file conflicts first
      const conflicts = await checkQueueConflicts(pendingItems);
      if (conflicts.length > 0) {
        debugLog.warn(
          `${conflicts.length} queue items have output file conflicts`,
        );
        setQueueConflicts(conflicts);
        setQueueConflictDialogOpen(true);
        return;
      }

      // Then check disk space
      await checkDiskSpaceAndStart(pendingItems);
    } catch (error) {
      // If overall check fails, proceed anyway
      debugLog.warn(`Queue pre-start check failed, proceeding anyway: ${error}`);
      await doStartQueue();
    }
  };

  // Check disk space for pending items and start if OK
  const checkDiskSpaceAndStart = async (pendingItems: QueueItem[]) => {
    // Get bitrate for estimation
    const bitrate =
      encodingSettings.qualityPreset === "custom"
        ? encodingSettings.customBitrate
        : encodingSettings.customBitrate;

    const checkSettings = {
      bitrate,
      qualityMode: encodingSettings.qualityMode,
      cqValue: encodingSettings.cq,
    };

    // Check disk space for each pending item
    const issues: Array<{
      videoName: string;
      driveLetter: string;
      availableFormatted: string;
      requiredFormatted: string;
    }> = [];

    for (const item of pendingItems) {
      try {
        const diskCheck = await window.ffmpegAPI.checkDiskSpace(
          item.outputPath,
          item.videoPath,
          checkSettings,
        );

        if (!diskCheck.sufficient) {
          issues.push({
            videoName: item.videoName,
            driveLetter: diskCheck.driveLetter,
            availableFormatted: diskCheck.availableFormatted,
            requiredFormatted: diskCheck.requiredFormatted,
          });
        }
      } catch (error) {
        // If check fails for an item, skip it (fail gracefully)
        debugLog.warn(
          `Disk space check failed for ${item.videoName}: ${error}`,
        );
      }
    }

    if (issues.length > 0) {
      debugLog.warn(
        `${issues.length} queue items have insufficient disk space`,
      );
      setQueueDiskSpaceIssues(issues);
      setQueueDiskSpaceDialogOpen(true);
      return;
    }

    // All checks passed, start the queue
    await doStartQueue();
  };

  // Handle queue conflict - auto-rename all conflicting outputs
  const handleQueueConflictAutoRename = async () => {
    setQueueConflictDialogOpen(false);

    // Rename all conflicting output paths
    for (const conflict of queueConflicts) {
      try {
        const newPath = await window.ffmpegAPI.resolveOutputConflict(
          conflict.outputPath,
        );
        // Update the queue item with new output path
        await window.ffmpegAPI.queueUpdateItemOutput(conflict.itemId, newPath);
        debugLog.file(
          `Auto-renamed output for ${conflict.videoName}: ${newPath}`,
        );
      } catch (error) {
        debugLog.error(`Failed to auto-rename ${conflict.outputPath}: ${error}`);
      }
    }

    setQueueConflicts([]);

    // Fetch fresh queue data after updates and continue with disk space check
    const { queue: freshQueue } = await window.ffmpegAPI.queueGetAll();
    const pendingItems = freshQueue.filter(
      (item: QueueItem) => item.status === "pending",
    );
    await checkDiskSpaceAndStart(pendingItems);
  };

  // Handle queue conflict - overwrite all existing files
  const handleQueueConflictOverwrite = async () => {
    setQueueConflictDialogOpen(false);
    setQueueConflicts([]);
    debugLog.warn("User chose to overwrite all conflicting output files");

    // Continue with disk space check
    const pendingItems = queue.filter((item) => item.status === "pending");
    await checkDiskSpaceAndStart(pendingItems);
  };

  // Handle queue conflict - cancel
  const handleQueueConflictCancel = () => {
    setQueueConflictDialogOpen(false);
    setQueueConflicts([]);
    debugLog.info("User cancelled queue start due to output conflicts");
  };

  const handlePauseQueue = async () => {
    try {
      debugLog.queue("Pausing queue processing");
      await window.ffmpegAPI.queuePause();
      setIsQueueProcessing(false);
    } catch (error) {
      console.error("Failed to pause queue:", error);
      debugLog.error(`Failed to pause queue: ${error}`);
    }
  };

  const handleResumeQueue = async () => {
    // Resume also goes through conflict/disk space checks in case new items were added while paused
    try {
      const pendingItems = queue.filter((item) => item.status === "pending");

      if (pendingItems.length === 0) {
        debugLog.queue("No pending items to resume");
        return;
      }

      // Check for output file conflicts
      const conflicts = await checkQueueConflicts(pendingItems);
      if (conflicts.length > 0) {
        debugLog.warn(
          `${conflicts.length} queue items have output file conflicts`,
        );
        setQueueConflicts(conflicts);
        setQueueConflictDialogOpen(true);
        return;
      }

      // Check disk space
      await checkDiskSpaceAndStart(pendingItems);
    } catch (error) {
      debugLog.warn(`Queue resume check failed, proceeding anyway: ${error}`);
      // Fallback to direct resume
      try {
        setIsQueueProcessing(true);
        await window.ffmpegAPI.queueResume();
      } catch (resumeError) {
        setIsQueueProcessing(false);
        console.error("Failed to resume queue:", resumeError);
        debugLog.error(`Failed to resume queue: ${resumeError}`);
      }
    }
  };

  const handleOpenQueueItemFolder = async (outputPath: string) => {
    try {
      await window.ffmpegAPI.openOutputFolder(outputPath);
    } catch (error) {
      console.error("Failed to open output folder:", error);
    }
  };

  // Get encoding settings for disk space estimation
  const diskSpaceEncodingSettings = {
    bitrate:
      encodingSettings.qualityPreset === "custom"
        ? encodingSettings.customBitrate
        : encodingSettings.customBitrate,
    qualityMode: encodingSettings.qualityMode,
    cqValue: encodingSettings.cq,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Main content area with padding */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold">{t("wypalarkaTitle")}</h1>
            <p className="text-muted-foreground">{t("wypalarkaSubtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WypalarkaSettingsModal
            settings={encodingSettings}
            onSettingsChange={setEncodingSettings}
            disabled={status === "processing"}
            gpuAvailable={gpuAvailable}
            gpuInfo={gpuInfo}
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
          />

          {status === "completed" && (
            <>
              <Button
                variant="default"
                onClick={handleOpenOutputFolder}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                {t("wypalarkaShowInFolder")}
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                {t("wypalarkaReset")}
              </Button>
            </>
          )}

          {status === "error" && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              {t("wypalarkaReset")}
            </Button>
          )}
        </div>
      </div>

      {/* FFmpeg Not Installed Alert */}
      {ffmpegInstalled === false && (
        <Alert variant="destructive">
          <Download className="h-4 w-4" />
          <AlertTitle>{t("wypalarkaFfmpegRequired")}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{t("wypalarkaFfmpegNotInstalled")}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDownloadDialog(true)}
              className="ml-4"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("wypalarkaFfmpegDownload")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="single" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="w-fit">
          <TabsTrigger
            value="single"
            disabled={status === "processing" || isQueueProcessing}
          >
            {t("wypalarkaSingleMode")}
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            disabled={status === "processing" || isQueueProcessing}
          >
            {t("wypalarkaQueueMode")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4 flex min-h-0 flex-1 gap-6">
          {/* Left Panel - File Input */}
          <div className="w-96 flex-shrink-0 overflow-y-auto">
            <WypalarkaFileInput
              ref={fileInputRef}
              onFilesSelected={handleStartProcess}
              disabled={status === "processing" || !ffmpegInstalled}
              onVideoPathChange={setCurrentVideoPath}
              onOutputPathChange={setCurrentOutputPath}
              onReadyChange={setSingleFileReady}
            />
          </div>

          {/* Right Panel - Progress */}
          <div className="min-w-0 flex-1">
            <WypalarkaProgressPanel
              logs={logs}
              progress={progress}
              status={status}
              errorMessage={errorMessage}
              canStart={singleFileReady && !!ffmpegInstalled}
              onStart={handleSingleFileStart}
              onCancel={handleCancelProcess}
            />
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-4 flex min-h-0 flex-1 gap-6">
          {/* Left Panel - Queue List */}
          <div className="flex w-96 flex-shrink-0 flex-col">
            <WypalarkaQueuePanel
              queue={queue}
              stats={queueStats}
              isProcessing={isQueueProcessing}
              onAddFiles={handleAddFilesToQueue}
              onRemoveItem={handleRemoveFromQueue}
              onOpenFolder={handleOpenQueueItemFolder}
            />
          </div>

          {/* Right Panel - Progress */}
          <div className="min-w-0 flex-1">
            <WypalarkaQueueProgressPanel
              currentItem={
                queue.find((item) => item.status === "processing") || null
              }
              stats={queueStats}
              queue={queue}
              isProcessing={isQueueProcessing}
              onAddFiles={handleAddFilesToQueue}
              onStart={handleStartQueue}
              onPause={handlePauseQueue}
              onResume={handleResumeQueue}
              onClearQueue={handleClearQueue}
            />
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Disk Space Footer Bar */}
      <WypalarkaDiskSpaceBar
        outputPath={currentOutputPath}
        videoPath={currentVideoPath}
        encodingSettings={diskSpaceEncodingSettings}
        queueItems={queue
          .filter((item) => item.status === "pending")
          .map((item) => ({
            videoPath: item.videoPath,
            outputPath: item.outputPath,
          }))}
      />

      {/* FFmpeg Download Dialog */}
      <WypalarkaFfmpegDownloadDialog
        open={showDownloadDialog}
        onClose={handleDownloadDialogClose}
      />

      {/* Disk Space Warning Dialog (Single File) */}
      <WypalarkaDiskSpaceDialog
        open={diskSpaceDialogOpen}
        availableFormatted={diskSpaceCheckResult?.availableFormatted ?? ""}
        requiredFormatted={diskSpaceCheckResult?.requiredFormatted ?? ""}
        driveLetter={diskSpaceCheckResult?.driveLetter ?? ""}
        outputPath={diskSpaceCheckResult?.outputPath ?? ""}
        onProceed={handleDiskSpaceProceed}
        onChangeLocation={handleDiskSpaceChangeLocation}
        onCancel={handleDiskSpaceCancel}
      />

      {/* Queue Disk Space Warning Dialog */}
      <WypalarkaQueueDiskSpaceDialog
        open={queueDiskSpaceDialogOpen}
        issues={queueDiskSpaceIssues}
        onProceed={handleQueueDiskSpaceProceed}
        onCancel={handleQueueDiskSpaceCancel}
      />

      {/* Queue Output Conflict Dialog */}
      <WypalarkaQueueConflictDialog
        open={queueConflictDialogOpen}
        conflicts={queueConflicts}
        onAutoRenameAll={handleQueueConflictAutoRename}
        onOverwriteAll={handleQueueConflictOverwrite}
        onCancel={handleQueueConflictCancel}
      />
    </div>
  );
}
