import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Film,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface WypalarkaQueueItemProps {
  item: QueueItem;
  onRemove: (id: string) => void;
  onOpenFolder?: (outputPath: string) => void;
}

export function WypalarkaQueueItem({
  item,
  onRemove,
  onOpenFolder,
}: WypalarkaQueueItemProps) {
  const { t } = useTranslation();

  const handleOpenFolder = () => {
    if (onOpenFolder && item.outputPath) {
      onOpenFolder(item.outputPath);
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {t("wypalarkaQueueItemPending")}
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="animate-pulse gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("wypalarkaQueueItemProcessing")}
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3" />
            {t("wypalarkaQueueItemCompleted")}
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t("wypalarkaQueueItemError")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {t("wypalarkaQueueItemCancelled")}
          </Badge>
        );
    }
  };

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status and action buttons */}
          <div className="flex items-start justify-between">
            {getStatusBadge()}
            <div className="flex gap-1">
              {item.status === "completed" && onOpenFolder && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleOpenFolder}
                  title={t("wypalarkaShowInFolder")}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(item.id)}
                disabled={item.status === "processing"}
                title={t("wypalarkaQueueRemoveItem")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video file */}
          <div className="flex items-center gap-2 text-sm">
            <Film className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium" title={item.videoPath}>
              {item.videoName}
            </span>
          </div>

          {/* Subtitle file */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span
              className="text-muted-foreground truncate"
              title={item.subtitlePath}
            >
              {item.subtitleName}
            </span>
          </div>

          {/* Progress bar (only for processing) */}
          {item.status === "processing" && item.progress && (
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{item.progress.percentage.toFixed(1)}%</span>
                {item.progress.eta && <span>{item.progress.eta}</span>}
              </div>
              <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, item.progress.percentage)}%`,
                  }}
                />
              </div>
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{item.progress.fps} FPS</span>
                <span>{item.progress.speed}</span>
              </div>
            </div>
          )}

          {/* Error message and last logs */}
          {item.status === "error" && (
            <div className="space-y-2">
              {item.error && (
                <div className="text-destructive bg-destructive/10 rounded-md p-2 text-xs font-medium">
                  {item.error}
                </div>
              )}
              {item.logs.length > 0 && (
                <details className="text-xs">
                  <summary className="text-muted-foreground hover:text-foreground mb-1 cursor-pointer">
                    Show logs ({item.logs.length} lines)
                  </summary>
                  <div className="bg-muted/30 max-h-32 space-y-0.5 overflow-y-auto rounded-md p-2 font-mono">
                    {item.logs.slice(-10).map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.type === "error"
                            ? "text-red-500"
                            : log.type === "warning"
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                        }
                      >
                        {log.log}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
