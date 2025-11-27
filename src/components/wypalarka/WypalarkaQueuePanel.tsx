import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Play, Pause, Trash2, ListOrdered } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WypalarkaQueueItem } from "./WypalarkaQueueItem";
import { WypalarkaAddFilesDialog } from "./WypalarkaAddFilesDialog";

interface WypalarkaQueuePanelProps {
  queue: QueueItem[];
  stats: QueueStats;
  isProcessing: boolean;
  onAddFiles: (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => void;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onOpenFolder?: (outputPath: string) => void;
}

export function WypalarkaQueuePanel({
  queue,
  stats,
  isProcessing,
  onAddFiles,
  onRemoveItem,
  onClearQueue,
  onStart,
  onPause,
  onResume,
  onOpenFolder,
}: WypalarkaQueuePanelProps) {
  const { t } = useTranslation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isPaused = stats.processing === 0 && stats.pending > 0 && !isProcessing;
  const hasItems = queue.length > 0;
  const hasProcessableItems = stats.pending > 0 || stats.processing > 0;

  const handleFilesAdded = async (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => {
    onAddFiles(files);
  };

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              <CardTitle>{t("wypalarkaQueueTitle")}</CardTitle>
            </div>
          </div>
          <CardDescription>{t("wypalarkaQueueDesc")}</CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Stats */}
          {hasItems && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  {t("wypalarkaQueueTotal")}:{" "}
                  <span className="text-foreground font-medium">
                    {stats.total}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {t("wypalarkaQueueCompleted")}:{" "}
                  <span className="font-medium text-green-600">
                    {stats.completed}
                  </span>
                </span>
                {stats.error > 0 && (
                  <span className="text-muted-foreground">
                    {t("wypalarkaQueueFailed")}:{" "}
                    <span className="text-destructive font-medium">
                      {stats.error}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Queue List */}
          <ScrollArea className="flex-1">
            {queue.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <ListOrdered className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">
                  {t("wypalarkaQueueEmpty")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(true)}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("wypalarkaQueueAddFiles")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {queue.map((item) => (
                  <WypalarkaQueueItem
                    key={item.id}
                    item={item}
                    onRemove={onRemoveItem}
                    onOpenFolder={onOpenFolder}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Controls */}
          <div className="space-y-2 border-t pt-4">
            <Button
              onClick={() => setAddDialogOpen(true)}
              variant="outline"
              className="w-full gap-2"
              disabled={isProcessing}
            >
              <Plus className="h-4 w-4" />
              {t("wypalarkaQueueAddFiles")}
            </Button>

            <div className="flex flex-col gap-2">
              {!isProcessing && stats.pending > 0 && (
                <Button onClick={onStart} className="w-full gap-2">
                  <Play className="h-4 w-4" />
                  {t("wypalarkaQueueStartQueue")}
                </Button>
              )}

              {isProcessing && (
                <Button
                  onClick={onPause}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  <Pause className="h-4 w-4" />
                  {t("wypalarkaQueuePause")}
                </Button>
              )}

              {isPaused && (
                <Button onClick={onResume} className="w-full gap-2">
                  <Play className="h-4 w-4" />
                  {t("wypalarkaQueueResume")}
                </Button>
              )}

              {hasItems && (
                <Button
                  onClick={onClearQueue}
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("wypalarkaQueueClearAll")}
                </Button>
              )}
            </div>
          </div>
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
