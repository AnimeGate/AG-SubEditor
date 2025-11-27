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
import { AlertTriangle, HardDrive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiskSpaceIssue {
  videoName: string;
  driveLetter: string;
  availableFormatted: string;
  requiredFormatted: string;
}

interface WypalarkaQueueDiskSpaceDialogProps {
  open: boolean;
  issues: DiskSpaceIssue[];
  onProceed: () => void;
  onCancel: () => void;
}

export function WypalarkaQueueDiskSpaceDialog({
  open,
  issues,
  onProceed,
  onCancel,
}: WypalarkaQueueDiskSpaceDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t("wypalarkaQueueDiskSpaceTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("wypalarkaQueueDiskSpaceDescription", { count: issues.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="max-h-60">
            <div className="space-y-2 pr-4">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <HardDrive className="h-4 w-4 text-destructive" />
                    <span className="truncate" title={issue.videoName}>
                      {issue.videoName}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 ml-6 flex gap-4">
                    <span>
                      {t("wypalarkaDiskSpaceRequired")}: {issue.requiredFormatted}
                    </span>
                    <span className="text-destructive">
                      {t("wypalarkaDiskSpaceAvailable")}: {issue.availableFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
            <p className="text-destructive text-sm">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              {t("wypalarkaQueueDiskSpaceWarning")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={onCancel}>
            {t("wypalarkaCancel")}
          </Button>
          <Button variant="destructive" onClick={onProceed}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t("wypalarkaDiskSpaceProceedAnyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
