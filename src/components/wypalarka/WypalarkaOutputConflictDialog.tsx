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
import { AlertTriangle, FileEdit, FolderOpen } from "lucide-react";

interface WypalarkaOutputConflictDialogProps {
  open: boolean;
  outputPath: string;
  onOverwrite: () => void;
  onAutoRename: () => void;
  onChooseNew: () => void;
  onCancel: () => void;
}

export function WypalarkaOutputConflictDialog({
  open,
  outputPath,
  onOverwrite,
  onAutoRename,
  onChooseNew,
  onCancel,
}: WypalarkaOutputConflictDialogProps) {
  const { t } = useTranslation();

  // Extract just the filename for display
  const fileName = outputPath.split(/[\\/]/).pop() || outputPath;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t("wypalarkaConflictTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("wypalarkaConflictDescription", { fileName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p
            className="text-muted-foreground text-sm break-all"
            title={outputPath}
          >
            {outputPath}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            onClick={onOverwrite}
            className="justify-start"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t("wypalarkaConflictOverwrite")}
          </Button>

          <Button
            variant="secondary"
            onClick={onAutoRename}
            className="justify-start"
          >
            <FileEdit className="mr-2 h-4 w-4" />
            {t("wypalarkaConflictAutoRename")}
          </Button>

          <Button
            variant="secondary"
            onClick={onChooseNew}
            className="justify-start"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {t("wypalarkaConflictChooseNew")}
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
