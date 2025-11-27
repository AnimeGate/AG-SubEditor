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
import { AlertTriangle, FileEdit, Trash2 } from "lucide-react";

export interface QueueConflict {
  itemId: string;
  videoName: string;
  outputPath: string;
}

interface WypalarkaQueueConflictDialogProps {
  open: boolean;
  conflicts: QueueConflict[];
  onAutoRenameAll: () => void;
  onOverwriteAll: () => void;
  onCancel: () => void;
}

export function WypalarkaQueueConflictDialog({
  open,
  conflicts,
  onAutoRenameAll,
  onOverwriteAll,
  onCancel,
}: WypalarkaQueueConflictDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t("wypalarkaQueueConflictTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("wypalarkaQueueConflictDescription", { count: conflicts.length })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2 pr-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.itemId}
                className="bg-muted/50 rounded-md p-2 text-sm"
              >
                <div className="font-medium truncate" title={conflict.videoName}>
                  {conflict.videoName}
                </div>
                <div
                  className="text-muted-foreground text-xs truncate"
                  title={conflict.outputPath}
                >
                  → {conflict.outputPath.split(/[\\/]/).pop()}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onAutoRenameAll}
            className="justify-start"
          >
            <FileEdit className="mr-2 h-4 w-4" />
            {t("wypalarkaQueueConflictAutoRename")}
          </Button>

          <Button
            variant="destructive"
            onClick={onOverwriteAll}
            className="justify-start"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("wypalarkaQueueConflictOverwrite")}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t("wypalarkaCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
