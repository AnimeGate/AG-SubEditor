import { useEffect, useRef } from "react";
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
import { Terminal, Zap, CheckCircle, XCircle, Clock, Play, StopCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LogEntry {
  log: string;
  type: LogType;
}

interface WypalarkaProgressPanelProps {
  logs: LogEntry[];
  progress: FFmpegProgress | null;
  status: "idle" | "processing" | "completed" | "error";
  errorMessage?: string;
  // Control props
  canStart?: boolean;
  onStart?: () => void;
  onCancel?: () => void;
}

export function WypalarkaProgressPanel({
  logs,
  progress,
  status,
  errorMessage,
  canStart,
  onStart,
  onCancel,
}: WypalarkaProgressPanelProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  const getStatusBadge = () => {
    switch (status) {
      case "idle":
        return (
          <Badge variant="secondary" className="gap-1">
            <Terminal className="h-3 w-3" />
            {t("wypalarkaStatusIdle")}
          </Badge>
        );
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
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>{t("wypalarkaProgressTitle")}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Control Buttons */}
            <TooltipProvider>
              {/* Start Button - show when idle and can start */}
              {status === "idle" && canStart && onStart && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" onClick={onStart}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("wypalarkaStartProcess")}</TooltipContent>
                </Tooltip>
              )}

              {/* Cancel Button - show when processing */}
              {status === "processing" && onCancel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="icon" onClick={onCancel}>
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("wypalarkaCancel")}</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>

            {/* Status Badge */}
            {getStatusBadge()}
          </div>
        </div>
        <CardDescription>{t("wypalarkaProgressDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t("wypalarkaProgress")}: {progress.percentage.toFixed(1)}%
              </span>
              {progress.eta && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{progress.eta}</span>
                </div>
              )}
            </div>
            <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, progress.percentage)}%` }}
              />
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {progress.frame} {t("wypalarkaFrames")}
              </span>
              <span>{progress.fps} FPS</span>
              <span>{progress.bitrate}</span>
              <span>
                {progress.time} @ {progress.speed}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === "error" && errorMessage && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
            <p className="text-destructive text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Log Output */}
        <div className="min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full rounded-md border">
            <div className="space-y-1 p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground italic">
                  {t("wypalarkaNoLogs")}
                </p>
              ) : (
                logs.map((entry, index) => {
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
      </CardContent>
    </Card>
  );
}
