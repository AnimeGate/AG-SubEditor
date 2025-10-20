import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WypalarkaFileInput } from "./WypalarkaFileInput";
import { WypalarkaProgressPanel } from "./WypalarkaProgressPanel";
import { WypalarkaQueuePanel } from "./WypalarkaQueuePanel";
import { WypalarkaQueueProgressPanel } from "./WypalarkaQueueProgressPanel";
import { WypalarkaSettingsModal } from "./WypalarkaSettingsModal";
import { WypalarkaFfmpegDownloadDialog } from "./WypalarkaFfmpegDownloadDialog";
import { WypalarkaTour } from "./WypalarkaTour";
import type { EncodingSettings } from "./WypalarkaSettings";
import { useTranslation } from "react-i18next";
import { Flame, StopCircle, Sparkles, FolderOpen, Download, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWypalarkaTour } from "@/hooks/use-wypalarka-tour";
import { debugLog } from "@/helpers/debug-logger";

type ProcessStatus = "idle" | "processing" | "completed" | "error";

interface LogEntry {
  log: string;
  type: LogType;
}

export default function Wypalarka() {
  const { t } = useTranslation();

  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<FFmpegProgress | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [completedOutputPath, setCompletedOutputPath] = useState<string | null>(null);
  const [encodingSettings, setEncodingSettings] = useState<EncodingSettings>({
    qualityPreset: "medium",
    customBitrate: "2400k",
    useHardwareAccel: false,
    codec: "h264",
    preset: "p4",
    qualityMode: "vbr_hq",
    cq: 19,
    gpuDecode: false,
    spatialAQ: true,
    temporalAQ: true,
    rcLookahead: 20,
  });
  const [gpuAvailable, setGpuAvailable] = useState<boolean | undefined>(undefined);
  const [gpuInfo, setGpuInfo] = useState<string>("");
  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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

  // Tour management
  const { runTour, handleTourCallback, restartTour } = useWypalarkaTour();

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

  // Sync encoding settings changes with queue processor
  useEffect(() => {
    const syncSettings = async () => {
      const bitrate = encodingSettings.qualityPreset === "custom"
        ? encodingSettings.customBitrate
        : encodingSettings.customBitrate;

      try {
        await window.ffmpegAPI.queueUpdateSettings({
          bitrate,
          useHardwareAccel: encodingSettings.useHardwareAccel,
          gpuEncode: encodingSettings.useHardwareAccel,
          gpuDecode: encodingSettings.gpuDecode,
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

  const handleStartProcess = async (videoPath: string, subtitlePath: string, outputPath: string) => {
    try {
      setStatus("processing");
      setLogs([]);
      setProgress(null);
      setErrorMessage(undefined);

      // Get bitrate from settings
      const bitrate = encodingSettings.qualityPreset === "custom"
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
          gpuDecode: encodingSettings.gpuDecode,
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
      setLogs((prev) => [...prev, { log: `✗ Failed to start process: ${errorMsg}`, type: "error" }]);
    }
  };

  const handleCancelProcess = async () => {
    try {
      await window.ffmpegAPI.cancelProcess();
      setStatus("idle");
      setLogs((prev) => [...prev, { log: "Process cancelled by user", type: "warning" }]);
    } catch (error) {
      console.error("Failed to cancel process:", error);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setLogs([]);
    setProgress(null);
    setErrorMessage(undefined);
    setCompletedOutputPath(null);
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
  const handleAddFilesToQueue = async (files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>) => {
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

  const handleStartQueue = async () => {
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
    try {
      debugLog.queue("Resuming queue processing");
      setIsQueueProcessing(true);
      await window.ffmpegAPI.queueResume();
    } catch (error) {
      setIsQueueProcessing(false);
      console.error("Failed to resume queue:", error);
      debugLog.error(`Failed to resume queue: ${error}`);
    }
  };

  const handleOpenQueueItemFolder = async (outputPath: string) => {
    try {
      await window.ffmpegAPI.openOutputFolder(outputPath);
    } catch (error) {
      console.error("Failed to open output folder:", error);
    }
  };

  // Handle tour step changes - auto-open settings dialog
  const handleTourStepChange = (stepIndex: number) => {
    // Steps 4, 5, 6 are the settings button, quality preset, and GPU acceleration
    // Keep the dialog open during all these steps
    if (stepIndex >= 4 && stepIndex <= 6) {
      if (!settingsDialogOpen) {
        setTimeout(() => setSettingsDialogOpen(true), 300);
      }
    } else if (stepIndex > 6) {
      // Close settings dialog when moving past step 6
      if (settingsDialogOpen) {
        setSettingsDialogOpen(false);
      }
    }
  };

  return (
    <>
      {/* Tour Component */}
      <WypalarkaTour
        run={runTour}
        onCallback={handleTourCallback}
        onStepChange={handleTourStepChange}
      />

      <div className="flex flex-col h-full p-6 gap-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold">{t("wypalarkaTitle")}</h1>
            <p className="text-muted-foreground">{t("wypalarkaSubtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={restartTour}
            title={t("tourShowGuide")}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <WypalarkaSettingsModal
            settings={encodingSettings}
            onSettingsChange={setEncodingSettings}
            disabled={status === "processing"}
            gpuAvailable={gpuAvailable}
            gpuInfo={gpuInfo}
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
          />

          {status === "processing" && (
            <Button variant="destructive" onClick={handleCancelProcess} className="gap-2">
              <StopCircle className="h-4 w-4" />
              {t("wypalarkaCancel")}
            </Button>
          )}

          {status === "completed" && (
            <>
              <Button variant="default" onClick={handleOpenOutputFolder} className="gap-2">
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
              <Download className="h-4 w-4 mr-2" />
              {t("wypalarkaFfmpegDownload")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="single" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="single">{t("wypalarkaSingleMode")}</TabsTrigger>
          <TabsTrigger value="queue">
            {t("wypalarkaQueueMode")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="flex-1 flex gap-6 min-h-0 mt-4">
          {/* Left Panel - File Input */}
          <div className="w-96 flex-shrink-0 overflow-y-auto">
            <WypalarkaFileInput
              onFilesSelected={handleStartProcess}
              disabled={status === "processing" || !ffmpegInstalled}
            />
          </div>

          {/* Right Panel - Progress */}
          <div className="flex-1 min-w-0">
            <WypalarkaProgressPanel
              logs={logs}
              progress={progress}
              status={status}
              errorMessage={errorMessage}
            />
          </div>
        </TabsContent>

        <TabsContent value="queue" className="flex-1 flex gap-6 min-h-0 mt-4">
          {/* Left Panel - Queue List */}
          <div className="w-96 flex-shrink-0 overflow-y-auto">
            <WypalarkaQueuePanel
              queue={queue}
              stats={queueStats}
              isProcessing={isQueueProcessing}
              onAddFiles={handleAddFilesToQueue}
              onRemoveItem={handleRemoveFromQueue}
              onClearQueue={handleClearQueue}
              onStart={handleStartQueue}
              onPause={handlePauseQueue}
              onResume={handleResumeQueue}
              onOpenFolder={handleOpenQueueItemFolder}
            />
          </div>

          {/* Right Panel - Progress */}
          <div className="flex-1 min-w-0">
            <WypalarkaQueueProgressPanel
              currentItem={queue.find((item) => item.status === "processing") || null}
              stats={queueStats}
              queue={queue}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* FFmpeg Download Dialog */}
      <WypalarkaFfmpegDownloadDialog
        open={showDownloadDialog}
        onClose={handleDownloadDialogClose}
      />
      </div>
    </>
  );
}
