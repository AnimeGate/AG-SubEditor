import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WypalarkaFfmpegDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

type DownloadStatus = "prompt" | "downloading" | "success" | "error";

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function WypalarkaFfmpegDownloadDialog({
  open,
  onClose,
}: WypalarkaFfmpegDownloadDialogProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<DownloadStatus>("prompt");
  const [progress, setProgress] = useState<FFmpegDownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!open) {
      // Reset state when dialog is closed
      setStatus("prompt");
      setProgress(null);
      setErrorMessage("");
      return;
    }

    // Set up listeners when dialog opens
    const unsubProgress = window.ffmpegAPI.onDownloadProgress((progress) => {
      setProgress(progress);
      if (progress.status === "downloading" || progress.status === "extracting") {
        setStatus("downloading");
      }
    });

    const unsubComplete = window.ffmpegAPI.onDownloadComplete(() => {
      setStatus("success");
    });

    const unsubError = window.ffmpegAPI.onDownloadError((error) => {
      setStatus("error");
      setErrorMessage(error);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [open]);

  const handleStartDownload = async () => {
    try {
      setStatus("downloading");
      setErrorMessage("");
      await window.ffmpegAPI.startDownload();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRetry = () => {
    setStatus("prompt");
    setProgress(null);
    setErrorMessage("");
  };

  const handleClose = () => {
    if (status === "downloading") {
      // Don't allow closing during download
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("wypalarkaFfmpegRequired")}
          </DialogTitle>
          <DialogDescription>
            {status === "prompt" && t("wypalarkaFfmpegNotInstalled")}
            {status === "downloading" && progress && progress.totalBytes > 0 && (
              `${t("wypalarkaFfmpegDownloadingStatus")}: ${formatBytes(progress.downloadedBytes)} / ${formatBytes(progress.totalBytes)}`
            )}
            {status === "downloading" && (!progress || progress.totalBytes === 0) && t("wypalarkaFfmpegStartingDownload")}
            {status === "success" && t("wypalarkaFfmpegInstalled")}
            {status === "error" && t("wypalarkaFfmpegError")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt State */}
          {status === "prompt" && (
            <div className="flex flex-col gap-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>FFmpeg</AlertTitle>
                <AlertDescription>
                  {t("wypalarkaFfmpegDescription")}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("wypalarkaFfmpegClose")}
                </Button>
                <Button onClick={handleStartDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("wypalarkaFfmpegDownload")}
                </Button>
              </div>
            </div>
          )}

          {/* Downloading State */}
          {status === "downloading" && progress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.status === "downloading" && t("wypalarkaFfmpegDownloading")}
                    {progress.status === "extracting" && t("wypalarkaFfmpegExtracting")}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(progress.percentage)}%
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="flex flex-col gap-4">
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-500">
                  {t("wypalarkaFfmpegInstalled")}
                </AlertTitle>
                <AlertDescription>
                  {t("wypalarkaFfmpegSuccessDesc")}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  {t("wypalarkaFfmpegClose")}
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="flex flex-col gap-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("wypalarkaFfmpegError")}</AlertTitle>
                <AlertDescription>
                  {errorMessage || t("wypalarkaFfmpegErrorUnknown")}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("wypalarkaFfmpegClose")}
                </Button>
                <Button onClick={handleRetry}>
                  {t("wypalarkaFfmpegRetry")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
