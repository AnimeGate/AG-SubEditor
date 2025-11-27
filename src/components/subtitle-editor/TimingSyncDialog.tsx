import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import type { SubtitleLine } from "@/lib/ass-parser";
import { parseASSFile } from "@/lib/ass-parser";
import {
  matchSubtitleLinesByIndex,
  applyReferenceTiming,
  getMatchingStatistics,
  type TimingMatchResult,
} from "@/lib/timing-sync-utils";
import { TimingComparisonTable } from "./TimingComparisonTable";
import { useTranslation } from "react-i18next";

interface TimingSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSubtitles: SubtitleLine[];
  onApplyTiming: (updatedSubtitles: SubtitleLine[]) => void;
}

export function TimingSyncDialog({
  open,
  onOpenChange,
  currentSubtitles,
  onApplyTiming,
}: TimingSyncDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceSubtitles, setReferenceSubtitles] = useState<SubtitleLine[]>(
    [],
  );
  const [matches, setMatches] = useState<TimingMatchResult[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string>("");

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setReferenceFile(file);

    try {
      const content = await file.text();
      const parsed = parseASSFile(content);

      if (parsed.length === 0) {
        setError(t("invalidReferenceFile"));
        setReferenceSubtitles([]);
        setMatches([]);
        setSelectedIndices(new Set());
        return;
      }

      setReferenceSubtitles(parsed);

      // Match by index
      const matchResults = matchSubtitleLinesByIndex(currentSubtitles, parsed);
      setMatches(matchResults);

      // Auto-select all matched lines
      const matchedIndices = matchResults
        .map((match, index) => (match.hasMatch ? index : -1))
        .filter((index) => index !== -1);
      setSelectedIndices(new Set(matchedIndices));
    } catch (err) {
      setError(t("invalidReferenceFile"));
      console.error("Error parsing reference file:", err);
    }
  };

  const handleApply = () => {
    if (selectedIndices.size === 0) {
      setError(t("selectReferenceFirst"));
      return;
    }

    const updatedSubtitles = applyReferenceTiming(
      currentSubtitles,
      matches,
      selectedIndices,
    );

    onApplyTiming(updatedSubtitles);
    onOpenChange(false);

    // Reset state
    setReferenceFile(null);
    setReferenceSubtitles([]);
    setMatches([]);
    setSelectedIndices(new Set());
    setError("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setReferenceFile(null);
    setReferenceSubtitles([]);
    setMatches([]);
    setSelectedIndices(new Set());
    setError("");
  };

  const stats = matches.length > 0 ? getMatchingStatistics(matches) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>{t("timingSyncTitle")}</DialogTitle>
          <DialogDescription>{t("timingSyncDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* File Upload Section */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="reference-file">{t("referenceFile")}</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {referenceFile ? referenceFile.name : t("uploadReferenceFile")}
              </Button>
              <input
                ref={fileInputRef}
                id="reference-file"
                type="file"
                accept=".ass"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("referenceFileDesc")}
            </p>
          </div>

          {/* Statistics */}
          {stats && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {stats.matched} / {stats.total} {t("linesMatched")} (
                {stats.percentage}
                %)
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for mismatched line counts */}
          {stats && stats.unmatched > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("lineMismatchWarning", {
                  refCount: referenceSubtitles.length,
                  sourceCount: currentSubtitles.length,
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Comparison Table */}
          {matches.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <TimingComparisonTable
                source={currentSubtitles}
                matches={matches}
                selectedIndices={selectedIndices}
                onSelectionChange={setSelectedIndices}
              />
            </div>
          )}

          {/* Empty State */}
          {matches.length === 0 && !error && (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed p-8">
              <div className="text-muted-foreground text-center">
                <Upload className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>{t("selectReferenceFirst")}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("closeDialog")}
          </Button>
          <Button onClick={handleApply} disabled={selectedIndices.size === 0}>
            {t("applyTimingSync")} ({selectedIndices.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
