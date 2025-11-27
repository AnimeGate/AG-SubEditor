import { useState } from "react";
import { FileUploadSection } from "./FileUploadSection";
import { TimeAdjustmentPanel } from "./TimeAdjustmentPanel";
import { SubtitleGrid } from "./SubtitleGrid";
import { InfoBar } from "./InfoBar";
import { TimingSyncDialog } from "./TimingSyncDialog";
import {
  parseASSFile,
  exportASSFile,
  type SubtitleLine,
} from "@/lib/ass-parser";
import { debugLog } from "@/helpers/debug-logger";

export default function SubtitleEditor() {
  const [fileName, setFileName] = useState<string>("");
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [originalFileContent, setOriginalFileContent] = useState<string>("");
  const [timingSyncDialogOpen, setTimingSyncDialogOpen] =
    useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    debugLog.file(`Loading subtitle file: ${file.name} (${file.size} bytes)`);
    const content = await file.text();
    setOriginalFileContent(content);
    const parsed = parseASSFile(content);
    debugLog.file(`Parsed ${parsed.length} subtitle lines from ${file.name}`);
    setFileName(file.name);
    setSubtitles(parsed);
    setSelectedIndices(new Set());
  };

  const handleExport = () => {
    if (!originalFileContent) return;

    debugLog.file(
      `Exporting subtitle file: ${fileName} (${subtitles.length} lines)`,
    );
    const exported = exportASSFile(originalFileContent, subtitles);
    const blob = new Blob([exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "subtitles.ass";
    a.click();
    URL.revokeObjectURL(url);
    debugLog.file(`Successfully exported ${fileName} (${blob.size} bytes)`);
  };

  const handleTimeAdjustment = (
    adjustment: number,
    unit: "milliseconds" | "seconds",
    applyTo: "start" | "end" | "both",
    scope: "selected" | "all",
  ) => {
    const adjustmentMs = unit === "seconds" ? adjustment * 1000 : adjustment;

    setSubtitles((prev) =>
      prev.map((sub, index) => {
        const shouldApply = scope === "all" || selectedIndices.has(index);
        if (!shouldApply) return sub;

        const newSub = { ...sub };

        if (applyTo === "start" || applyTo === "both") {
          newSub.startMs = Math.max(0, sub.startMs + adjustmentMs);
        }

        if (applyTo === "end" || applyTo === "both") {
          newSub.endMs = Math.max(0, sub.endMs + adjustmentMs);
        }

        // Ensure end time is after start time
        if (newSub.endMs < newSub.startMs) {
          newSub.endMs = newSub.startMs + 100; // Minimum 100ms duration
        }

        return newSub;
      }),
    );
  };

  const handleSubtitleUpdate = (
    index: number,
    updates: Partial<SubtitleLine>,
  ) => {
    setSubtitles((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, ...updates } : sub)),
    );
  };

  const handleSelectionChange = (indices: Set<number>) => {
    setSelectedIndices(indices);
  };

  const handleOpenTimingSync = () => {
    debugLog.file("Opening timing sync dialog");
    setTimingSyncDialogOpen(true);
  };

  const handleApplyTimingSync = (updatedSubtitles: SubtitleLine[]) => {
    debugLog.file(
      `Applying timing sync to ${updatedSubtitles.length} subtitle lines`,
    );
    setSubtitles(updatedSubtitles);
  };

  return (
    <div className="flex h-full flex-col">
      <FileUploadSection
        fileName={fileName}
        totalLines={subtitles.length}
        onFileUpload={handleFileUpload}
        onExport={handleExport}
        onImportTiming={handleOpenTimingSync}
        hasFile={subtitles.length > 0}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row">
        <TimeAdjustmentPanel
          onApply={handleTimeAdjustment}
          selectedCount={selectedIndices.size}
          totalCount={subtitles.length}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <SubtitleGrid
            subtitles={subtitles}
            selectedIndices={selectedIndices}
            onSelectionChange={handleSelectionChange}
            onSubtitleUpdate={handleSubtitleUpdate}
          />
        </div>
      </div>

      <InfoBar
        selectedCount={selectedIndices.size}
        totalCount={subtitles.length}
        subtitles={subtitles}
      />

      <TimingSyncDialog
        open={timingSyncDialogOpen}
        onOpenChange={setTimingSyncDialogOpen}
        currentSubtitles={subtitles}
        onApplyTiming={handleApplyTimingSync}
      />
    </div>
  );
}
