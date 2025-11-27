import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Film, FileText } from "lucide-react";

interface WypalarkaUnpairedDialogProps {
  open: boolean;
  videos: string[];
  onSelectSubtitle: (subtitlePath: string) => void;
  onCancel: () => void;
}

export function WypalarkaUnpairedDialog({
  open,
  videos,
  onSelectSubtitle,
  onCancel,
}: WypalarkaUnpairedDialogProps) {
  const { t } = useTranslation();

  const handleSelectSubtitle = async () => {
    const result = await window.ffmpegAPI.selectSubtitleFile();
    if (result) {
      onSelectSubtitle(result.filePath);
    }
  };

  // Extract just filenames for display
  const fileNames = videos.map(
    (path) => path.split(/[\\/]/).pop() || path,
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            {t("wypalarkaUnpairedTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("wypalarkaUnpairedDescription", { count: videos.length })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-40">
          <ul className="space-y-1 text-sm">
            {fileNames.map((name, i) => (
              <li
                key={i}
                className="text-muted-foreground flex items-center gap-2"
                title={videos[i]}
              >
                <Film className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{name}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel}>
            {t("wypalarkaCancel")}
          </Button>
          <Button onClick={handleSelectSubtitle}>
            <FileText className="mr-2 h-4 w-4" />
            {t("wypalarkaUnpairedSelectSubtitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
