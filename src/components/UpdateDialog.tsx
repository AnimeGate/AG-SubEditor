import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RefreshCw, Sparkles, X } from "lucide-react";

// Check if content is HTML (from GitHub API) or Markdown
function isHtmlContent(content: string): boolean {
  return content.trim().startsWith("<");
}

// Component to render release notes (HTML or Markdown)
function ReleaseNotes({ content }: { content: string }) {
  const proseClasses =
    "prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs";

  if (isHtmlContent(content)) {
    // GitHub returns HTML - render it directly
    return (
      <div
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Markdown content (from our test methods)
  return (
    <div className={proseClasses}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

interface UpdateInfo {
  version: string;
  releaseNotes: string | null;
  releaseDate: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + "/s";
}

export function UpdateDialog() {
  const { t } = useTranslation();
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.updaterAPI) return;

    const unsubChecking = window.updaterAPI.onCheckingForUpdate(() => {
      setState("checking");
    });

    const unsubAvailable = window.updaterAPI.onUpdateAvailable((info) => {
      setState("available");
      setUpdateInfo(info);
      setError(null);
      if (!dismissed) {
        setDialogOpen(true);
      }
    });

    const unsubNotAvailable = window.updaterAPI.onUpdateNotAvailable(() => {
      setState("idle");
    });

    const unsubProgress = window.updaterAPI.onDownloadProgress((prog) => {
      setState("downloading");
      setProgress(prog);
    });

    const unsubDownloaded = window.updaterAPI.onUpdateDownloaded((info) => {
      setState("ready");
      setUpdateInfo(info);
      setProgress(null);
      setDialogOpen(true);
      setDismissed(false);
    });

    const unsubError = window.updaterAPI.onUpdateError((err) => {
      setState("error");
      setError(err);
    });

    return () => {
      unsubChecking();
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
  }, [dismissed]);

  const handleDownload = () => {
    window.updaterAPI?.startDownload();
    setState("downloading");
    setProgress({ bytesPerSecond: 0, percent: 0, transferred: 0, total: 0 });
  };

  const handleInstall = () => {
    window.updaterAPI?.installNow();
  };

  const handleDismiss = () => {
    setDialogOpen(false);
    if (state === "available") {
      setDismissed(true);
    }
  };

  // Don't render if no update is available or ready
  if (state === "idle" || state === "checking") {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {state === "ready"
              ? t("updateReadyTitle")
              : t("updateAvailableTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("updateNewVersion", { version: updateInfo?.version })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Release Notes */}
          {updateInfo?.releaseNotes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("updateChangelog")}</h4>
              <ScrollArea className="bg-muted/50 h-48 rounded-lg border p-4">
                <ReleaseNotes content={updateInfo.releaseNotes} />
              </ScrollArea>
            </div>
          )}

          {/* Download Progress */}
          {state === "downloading" && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("updateDownloading")}</span>
                <span className="text-muted-foreground">
                  {Math.round(progress.percent)}%
                </span>
              </div>
              <Progress value={progress.percent} className="h-2" />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>
                  {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                </span>
                <span>{formatSpeed(progress.bytesPerSecond)}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {state === "error" && error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {state === "available" && (
            <>
              <Button variant="ghost" onClick={handleDismiss}>
                {t("updateLater")}
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                {t("updateDownload")}
              </Button>
            </>
          )}

          {state === "downloading" && (
            <Button variant="ghost" onClick={handleDismiss}>
              <X className="mr-2 h-4 w-4" />
              {t("updateHide")}
            </Button>
          )}

          {state === "ready" && (
            <>
              <Button variant="ghost" onClick={handleDismiss}>
                {t("updateLater")}
              </Button>
              <Button onClick={handleInstall} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t("updateInstallNow")}
              </Button>
            </>
          )}

          {state === "error" && (
            <Button variant="ghost" onClick={handleDismiss}>
              {t("updateClose")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
