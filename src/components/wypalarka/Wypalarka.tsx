import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WypalarkaFileInput } from "./WypalarkaFileInput";
import { WypalarkaProgressPanel } from "./WypalarkaProgressPanel";
import { WypalarkaSettingsModal } from "./WypalarkaSettingsModal";
import type { EncodingSettings } from "./WypalarkaSettings";
import { useTranslation } from "react-i18next";
import { Flame, StopCircle, Sparkles, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Check GPU availability on mount
  useEffect(() => {
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
  }, []);

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

  return (
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
          <WypalarkaSettingsModal
            settings={encodingSettings}
            onSettingsChange={setEncodingSettings}
            disabled={status === "processing"}
            gpuAvailable={gpuAvailable}
            gpuInfo={gpuInfo}
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
              disabled={status === "processing"}
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
    </div>
  );
}
