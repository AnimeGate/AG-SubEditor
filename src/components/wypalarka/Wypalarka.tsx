import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WypalarkaFileInput } from "./WypalarkaFileInput";
import { WypalarkaProgressPanel } from "./WypalarkaProgressPanel";
import { WypalarkaSettingsModal } from "./WypalarkaSettingsModal";
import { WypalarkaFfmpegDownloadDialog } from "./WypalarkaFfmpegDownloadDialog";
import { WypalarkaTour } from "./WypalarkaTour";
import type { EncodingSettings } from "./WypalarkaSettings";
import { useTranslation } from "react-i18next";
import { Flame, StopCircle, Sparkles, FolderOpen, Download, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWypalarkaTour } from "@/hooks/use-wypalarka-tour";

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
  });
  const [gpuAvailable, setGpuAvailable] = useState<boolean | undefined>(undefined);
  const [gpuInfo, setGpuInfo] = useState<string>("");
  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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

    return () => {
      unsubProgress();
      unsubLog();
      unsubComplete();
      unsubError();
    };
  }, []);

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
          <TabsTrigger value="queue" disabled>
            {t("wypalarkaQueueMode")}
            <Sparkles className="ml-2 h-3 w-3" />
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

        <TabsContent value="queue" className="flex-1 flex items-center justify-center min-h-0 mt-4">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-2 text-yellow-400" />
              <CardTitle>{t("wypalarkaQueueComingSoon")}</CardTitle>
              <CardDescription>{t("wypalarkaQueueDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                {t("wypalarkaQueueFeature")}
              </p>
            </CardContent>
          </Card>
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
