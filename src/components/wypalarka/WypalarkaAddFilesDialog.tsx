import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Film, FileText, Plus, Trash2, FolderOutput } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as path from "path-browserify";

interface FilePair {
  id: string;
  videoPath: string;
  videoName: string;
  subtitlePath: string;
  subtitleName: string;
  outputPath: string;
}

interface WypalarkaAddFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesAdded: (files: Array<Omit<QueueItem, "id" | "status" | "progress" | "logs">>) => void;
}

export function WypalarkaAddFilesDialog({ open, onOpenChange, onFilesAdded }: WypalarkaAddFilesDialogProps) {
  const { t } = useTranslation();
  const [filePairs, setFilePairs] = useState<FilePair[]>([]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addNewPair = () => {
    setFilePairs([
      ...filePairs,
      {
        id: generateId(),
        videoPath: "",
        videoName: "",
        subtitlePath: "",
        subtitleName: "",
        outputPath: "",
      },
    ]);
  };

  // If output settings change while dialog is open, recompute outputs for pairs
  useEffect(() => {
    const unsubscribe = (window as any).settingsAPI?.onOutputUpdated?.(async () => {
      try {
        const pairs = filePairs;
        const updated = await Promise.all(
          pairs.map(async (p) => {
            if (p.videoPath) {
              try {
                const resolved = await window.ffmpegAPI.getDefaultOutputPath(p.videoPath);
                return { ...p, outputPath: resolved } as FilePair;
              } catch {
                return p;
              }
            }
            return p;
          })
        );
        setFilePairs(updated);
      } catch {
        // ignore
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [open, filePairs]);

  const removePair = (id: string) => {
    setFilePairs(filePairs.filter(pair => pair.id !== id));
  };

  const handleSelectVideo = async (pairId: string) => {
    const result = await window.ffmpegAPI.selectVideoFile();
    if (result) {
      let defaultOut = "";
      try {
        defaultOut = await window.ffmpegAPI.getDefaultOutputPath(result.filePath);
      } catch {
        const baseName = result.fileName.replace(/\.[^.]+$/, "");
        defaultOut = `${baseName}_with_subs.mp4`;
      }
      setFilePairs(
        filePairs.map(pair =>
          pair.id === pairId
            ? {
                ...pair,
                videoPath: result.filePath,
                videoName: result.fileName,
                outputPath: pair.outputPath || defaultOut,
              }
            : pair
        )
      );
    }
  };

  const handleSelectSubtitle = async (pairId: string) => {
    const result = await window.ffmpegAPI.selectSubtitleFile();
    if (result) {
      setFilePairs(
        filePairs.map(pair =>
          pair.id === pairId
            ? {
                ...pair,
                subtitlePath: result.filePath,
                subtitleName: result.fileName,
              }
            : pair
        )
      );
    }
  };

  const handleSelectOutput = async (pairId: string) => {
    const pair = filePairs.find(p => p.id === pairId);
    if (!pair || !pair.outputPath) return;

    const result = await window.ffmpegAPI.selectOutputPath(pair.outputPath);
    if (result) {
      setFilePairs(
        filePairs.map(p =>
          p.id === pairId ? { ...p, outputPath: result } : p
        )
      );
    }
  };

  const handleAddFiles = () => {
    const validPairs = filePairs.filter(
      pair => pair.videoPath && pair.subtitlePath && pair.outputPath
    );

    if (validPairs.length === 0) return;

    const items = validPairs.map(pair => ({
      videoPath: pair.videoPath,
      videoName: pair.videoName,
      subtitlePath: pair.subtitlePath,
      subtitleName: pair.subtitleName,
      outputPath: pair.outputPath,
    }));

    onFilesAdded(items);
    setFilePairs([]);
    onOpenChange(false);
  };

  const canAddFiles = filePairs.some(
    pair => pair.videoPath && pair.subtitlePath && pair.outputPath
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("wypalarkaQueueAddFiles")}</DialogTitle>
          <DialogDescription>{t("wypalarkaQueueAddFilesDesc")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {filePairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("wypalarkaQueueAddFilesEmpty")}
              </div>
            ) : (
              filePairs.map((pair, index) => (
                <div key={pair.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pair {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removePair(pair.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Video File */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("wypalarkaVideoFile")}</label>
                    <Button
                      variant="outline"
                      className="w-full justify-start overflow-hidden"
                      onClick={() => handleSelectVideo(pair.id)}
                    >
                      <Film className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {pair.videoName || t("wypalarkaSelectVideo")}
                      </span>
                    </Button>
                  </div>

                  {/* Subtitle File */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("wypalarkaSubtitleFile")}</label>
                    <Button
                      variant="outline"
                      className="w-full justify-start overflow-hidden"
                      onClick={() => handleSelectSubtitle(pair.id)}
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {pair.subtitleName || t("wypalarkaSelectSubtitle")}
                      </span>
                    </Button>
                  </div>

                  {/* Output File */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("wypalarkaOutputFile")}</label>
                    <Button
                      variant="outline"
                      className="w-full justify-start overflow-hidden"
                      onClick={() => handleSelectOutput(pair.id)}
                      disabled={!pair.outputPath}
                    >
                      <FolderOutput className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {pair.outputPath ? path.basename(pair.outputPath) : t("wypalarkaSelectOutput")}
                      </span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={addNewPair} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("wypalarkaQueueAddPair")}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("wypalarkaFfmpegClose")}
            </Button>
            <Button onClick={handleAddFiles} disabled={!canAddFiles}>
              {t("wypalarkaQueueAddToQueue")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
