import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DropZone } from "@/components/ui/drop-zone";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ListOrdered, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { debugLog } from "@/helpers/debug-logger";
import {
  categorizeDroppedFiles,
  autoPairFiles,
  getFileName,
} from "@/lib/drop-helpers";
import { WypalarkaQueueItem } from "./WypalarkaQueueItem";
import { WypalarkaAddFilesDialog } from "./WypalarkaAddFilesDialog";
import { WypalarkaUnpairedDialog } from "./WypalarkaUnpairedDialog";

interface WypalarkaQueuePanelProps {
  queue: QueueItem[];
  stats: QueueStats;
  isProcessing: boolean;
  onAddFiles: (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => void;
  onRemoveItem: (id: string) => void;
  onOpenFolder?: (outputPath: string) => void;
}

export function WypalarkaQueuePanel({
  queue,
  stats,
  isProcessing,
  onAddFiles,
  onRemoveItem,
  onOpenFolder,
}: WypalarkaQueuePanelProps) {
  const { t } = useTranslation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [unpairedDialogOpen, setUnpairedDialogOpen] = useState(false);
  const [unpairedVideos, setUnpairedVideos] = useState<string[]>([]);

  const hasItems = queue.length > 0;

  const handleFilesAdded = async (
    files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>,
  ) => {
    onAddFiles(files);
  };

  const handleQueueDrop = async (files: File[]) => {
    const { videos, subtitles } = categorizeDroppedFiles(files);

    if (videos.length === 0) {
      // Only subtitles dropped - ignore
      debugLog.file("Only subtitle files dropped, ignoring");
      return;
    }

    debugLog.file(
      `Dropped ${videos.length} video(s) and ${subtitles.length} subtitle(s)`,
    );

    if (subtitles.length === 0) {
      // Only videos - prompt user to select subtitle
      debugLog.file("No subtitles dropped, showing unpaired dialog");
      setUnpairedVideos(videos);
      setUnpairedDialogOpen(true);
      return;
    }

    // Try to auto-pair
    const { paired, unpaired } = autoPairFiles(videos, subtitles);

    debugLog.file(
      `Auto-paired ${paired.length} files, ${unpaired.length} unpaired`,
    );

    // Add paired items to queue
    if (paired.length > 0) {
      const items = await Promise.all(
        paired.map(async ({ video, subtitle }) => {
          let outputPath: string;
          try {
            outputPath = await window.ffmpegAPI.getDefaultOutputPath(video);
          } catch {
            const baseName = getFileName(video).replace(/\.[^.]+$/, "");
            outputPath = `${baseName}_with_subs.mp4`;
          }
          return {
            videoPath: video,
            videoName: getFileName(video),
            subtitlePath: subtitle,
            subtitleName: getFileName(subtitle),
            outputPath,
          };
        }),
      );
      onAddFiles(items);
    }

    // Handle unpaired videos
    if (unpaired.length > 0) {
      setUnpairedVideos(unpaired);
      setUnpairedDialogOpen(true);
    }
  };

  const handleUnpairedSubtitleSelected = async (subtitlePath: string) => {
    debugLog.file(
      `Applying subtitle ${getFileName(subtitlePath)} to ${unpairedVideos.length} videos`,
    );

    const items = await Promise.all(
      unpairedVideos.map(async (video) => {
        let outputPath: string;
        try {
          outputPath = await window.ffmpegAPI.getDefaultOutputPath(video);
        } catch {
          const baseName = getFileName(video).replace(/\.[^.]+$/, "");
          outputPath = `${baseName}_with_subs.mp4`;
        }
        return {
          videoPath: video,
          videoName: getFileName(video),
          subtitlePath,
          subtitleName: getFileName(subtitlePath),
          outputPath,
        };
      }),
    );

    onAddFiles(items);
    setUnpairedDialogOpen(false);
    setUnpairedVideos([]);
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

          {/* Queue List with Drop Zone */}
          <DropZone
            onDrop={handleQueueDrop}
            accept={[
              ".mp4",
              ".mkv",
              ".avi",
              ".mov",
              ".webm",
              ".m4v",
              ".wmv",
              ".flv",
              ".ass",
              ".srt",
              ".ssa",
              ".sub",
              ".vtt",
            ]}
            multiple
            disabled={isProcessing}
            className="min-h-0 flex-1 rounded-lg border-2 border-dashed border-transparent transition-colors"
            activeClassName="border-primary bg-primary/5"
          >
            <ScrollArea className="h-full min-h-[200px]">
              {queue.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <Upload className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                  <p className="text-muted-foreground">
                    {t("wypalarkaQueueDropFilesHere")}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t("wypalarkaQueueDropHint")}
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
          </DropZone>
        </CardContent>
      </Card>

      {/* Add Files Dialog */}
      <WypalarkaAddFilesDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onFilesAdded={handleFilesAdded}
      />

      {/* Unpaired Videos Dialog */}
      <WypalarkaUnpairedDialog
        open={unpairedDialogOpen}
        videos={unpairedVideos}
        onSelectSubtitle={handleUnpairedSubtitleSelected}
        onCancel={() => {
          setUnpairedDialogOpen(false);
          setUnpairedVideos([]);
        }}
      />
    </>
  );
}
