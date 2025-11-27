import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Terminal,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ListChecks,
  Plus,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { WypalarkaAddFilesDialog } from "./WypalarkaAddFilesDialog";

interface WypalarkaQueueProgressPanelProps {
  currentItem: QueueItem | null;
  stats: QueueStats;
  queue: QueueItem[];
  isProcessing: boolean;
  onAddFiles: (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onClearQueue: () => void;
}

export function WypalarkaQueueProgressPanel({
  currentItem,
  stats,
  queue,
  isProcessing,
  onAddFiles,
  onStart,
  onPause,
  onResume,
  onClearQueue,
}: WypalarkaQueueProgressPanelProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Queue is "paused" only if it was previously started (has processing history)
  // and is not currently processing. A fresh queue should show "Start", not "Resume".
  const hasBeenStarted = queue.some(
    (item) =>
      item.logs.length > 0 ||
      item.status === "completed" ||
      item.status === "error" ||
      item.status === "cancelled",
  );
  const isPaused =
    hasBeenStarted && stats.processing === 0 && stats.pending > 0 && !isProcessing;
  const hasItems = queue.length > 0;
  const hasProcessableItems = stats.pending > 0 || stats.processing > 0;

  const handleFilesAdded = async (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => {
    onAddFiles(files);
  };

  // If no current item, find the last processed item (completed, error, or cancelled) to show its logs
  const displayItem =
    currentItem ||
    queue.find(
      (item) =>
        item.status === "error" ||
        item.status === "completed" ||
        item.status === "cancelled",
    );

  // Auto-scroll to bottom when new logs arrive (only for actively processing items)
  useEffect(() => {
    if (
      scrollRef.current &&
      currentItem?.logs &&
      currentItem.status === "processing"
    ) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [currentItem?.logs, currentItem?.status]);

  // When switching to display an error item, scroll to show error logs at the bottom
  useEffect(() => {
    if (scrollRef.current && displayItem && displayItem.status === "error") {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        // Scroll to bottom to show the most recent error logs
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [displayItem?.id, displayItem?.status]);

  const getStatusBadge = () => {
    if (!currentItem) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Terminal className="h-3 w-3" />
          {t("wypalarkaStatusIdle")}
        </Badge>
      );
    }

    switch (currentItem.status) {
      case "processing":
        return (
          <Badge variant="default" className="animate-pulse gap-1">
            <Zap className="h-3 w-3" />
            {t("wypalarkaStatusProcessing")}
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3" />
            {t("wypalarkaStatusCompleted")}
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t("wypalarkaStatusError")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {t("wypalarkaStatusIdle")}
          </Badge>
        );
    }
  };

  const overallProgress =
    stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              <CardTitle>{t("wypalarkaProgressTitle")}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Queue Control Buttons */}
              <TooltipProvider>
                {/* Add Files */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAddDialogOpen(true)}
                      disabled={isProcessing}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("wypalarkaQueueAddFiles")}</TooltipContent>
                </Tooltip>

                {/* Start/Pause/Resume */}
                {!isProcessing && !isPaused && hasProcessableItems && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" size="icon" onClick={onStart}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("wypalarkaQueueStart")}</TooltipContent>
                  </Tooltip>
                )}

                {isProcessing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" onClick={onPause}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("wypalarkaQueuePause")}</TooltipContent>
                  </Tooltip>
                )}

                {isPaused && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" size="icon" onClick={onResume}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("wypalarkaQueueResume")}</TooltipContent>
                  </Tooltip>
                )}

                {/* Clear Queue */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onClearQueue}
                      disabled={!hasItems || isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("wypalarkaQueueClear")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Status Badge */}
              {getStatusBadge()}
            </div>
          </div>
          <CardDescription>{t("wypalarkaQueueProgressDesc")}</CardDescription>
        </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Current/Last Item Info */}
        {displayItem && (
          <div className="bg-muted/50 space-y-2 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {currentItem ? (
                <span className="text-sm font-medium">
                  {t("wypalarkaQueueCurrentlyProcessing")}:
                </span>
              ) : (
                <span className="text-sm font-medium">
                  {displayItem.status === "error"
                    ? "Last Error:"
                    : displayItem.status === "completed"
                      ? "Last Completed:"
                      : "Last Item:"}
                </span>
              )}
            </div>
            <div className="text-muted-foreground text-sm">
              <div className="truncate" title={displayItem.videoName}>
                {displayItem.videoName}
              </div>
              <div className="text-xs">
                → {displayItem.outputPath.split(/[\\/]/).pop()}
              </div>
            </div>
          </div>
        )}

        {/* Current Item Progress (only show for actively processing items) */}
        {currentItem?.progress && currentItem.status === "processing" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t("wypalarkaProgress")}:{" "}
                {currentItem.progress.percentage.toFixed(1)}%
              </span>
              {currentItem.progress.eta && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{currentItem.progress.eta}</span>
                </div>
              )}
            </div>
            <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(100, currentItem.progress.percentage)}%`,
                }}
              />
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {currentItem.progress.frame} {t("wypalarkaFrames")}
              </span>
              <span>{currentItem.progress.fps} FPS</span>
              <span>{currentItem.progress.bitrate}</span>
              <span>
                {currentItem.progress.time} @ {currentItem.progress.speed}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {displayItem?.status === "error" && displayItem.error && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
            <p className="text-destructive text-sm font-medium">
              {displayItem.error}
            </p>
          </div>
        )}

        {/* Log Output */}
        <div className="min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full rounded-md border">
            <div className="space-y-1 p-4 font-mono text-xs">
              {!displayItem || displayItem.logs.length === 0 ? (
                <p className="text-muted-foreground italic">
                  {t("wypalarkaNoLogs")}
                </p>
              ) : (
                displayItem.logs.map((entry, index) => {
                  const getLogColor = (type: LogType) => {
                    switch (type) {
                      case "error":
                        return "text-red-500";
                      case "warning":
                        return "text-yellow-500";
                      case "success":
                        return "text-green-500";
                      case "metadata":
                        return "text-purple-400";
                      case "debug":
                        return "text-gray-500";
                      case "info":
                      default:
                        return "text-blue-400";
                    }
                  };

                  return (
                    <div key={index} className={getLogColor(entry.type)}>
                      {entry.log}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Overall Queue Progress */}
        {stats.total > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ListChecks className="h-4 w-4" />
                <span>{t("wypalarkaQueueOverallProgress")}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {stats.completed} / {stats.total}
              </span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-green-600 transition-all duration-300 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Add Files Dialog */}
      <WypalarkaAddFilesDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onFilesAdded={handleFilesAdded}
      />
    </>
  );
}
