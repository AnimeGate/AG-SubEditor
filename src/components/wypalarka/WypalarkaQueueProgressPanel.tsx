import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, Zap, CheckCircle, XCircle, Clock, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WypalarkaQueueProgressPanelProps {
  currentItem: QueueItem | null;
  stats: QueueStats;
  queue: QueueItem[];
}

export function WypalarkaQueueProgressPanel({ currentItem, stats, queue }: WypalarkaQueueProgressPanelProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // If no current item, find the last processed item (completed, error, or cancelled) to show its logs
  const displayItem = currentItem || queue.find(item =>
    item.status === "error" || item.status === "completed" || item.status === "cancelled"
  );

  // Auto-scroll to bottom when new logs arrive (only for actively processing items)
  useEffect(() => {
    if (scrollRef.current && currentItem?.logs && currentItem.status === "processing") {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [currentItem?.logs, currentItem?.status]);

  // When switching to display an error item, scroll to show error logs at the bottom
  useEffect(() => {
    if (scrollRef.current && displayItem && displayItem.status === "error") {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
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
          <Badge variant="default" className="gap-1 animate-pulse">
            <Zap className="h-3 w-3" />
            {t("wypalarkaStatusProcessing")}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
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

  const overallProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>{t("wypalarkaProgressTitle")}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>{t("wypalarkaQueueProgressDesc")}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Current/Last Item Info */}
        {displayItem && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {currentItem ? (
                <span className="text-sm font-medium">{t("wypalarkaQueueCurrentlyProcessing")}:</span>
              ) : (
                <span className="text-sm font-medium">
                  {displayItem.status === "error" ? "Last Error:" :
                   displayItem.status === "completed" ? "Last Completed:" : "Last Item:"}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="truncate" title={displayItem.videoName}>
                {displayItem.videoName}
              </div>
              <div className="text-xs">→ {displayItem.outputPath.split(/[\\/]/).pop()}</div>
            </div>
          </div>
        )}

        {/* Current Item Progress (only show for actively processing items) */}
        {currentItem?.progress && currentItem.status === "processing" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t("wypalarkaProgress")}: {currentItem.progress.percentage.toFixed(1)}%
              </span>
              {currentItem.progress.eta && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{currentItem.progress.eta}</span>
                </div>
              )}
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, currentItem.progress.percentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{currentItem.progress.frame} {t("wypalarkaFrames")}</span>
              <span>{currentItem.progress.fps} FPS</span>
              <span>{currentItem.progress.bitrate}</span>
              <span>{currentItem.progress.time} @ {currentItem.progress.speed}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {displayItem?.status === "error" && displayItem.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">{displayItem.error}</p>
          </div>
        )}

        {/* Log Output */}
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollRef} className="h-full border rounded-md">
            <div className="p-4 font-mono text-xs space-y-1">
              {!displayItem || displayItem.logs.length === 0 ? (
                <p className="text-muted-foreground italic">{t("wypalarkaNoLogs")}</p>
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
              <span className="text-sm text-muted-foreground">
                {stats.completed} / {stats.total}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
