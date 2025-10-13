import { useState } from "react";
import { FileUploadSection } from "./FileUploadSection";
import { TimeAdjustmentPanel } from "./TimeAdjustmentPanel";
import { SubtitleGrid } from "./SubtitleGrid";
import { InfoBar } from "./InfoBar";
import { parseASSFile, exportASSFile, type SubtitleLine } from "@/lib/ass-parser";

export default function SubtitleEditor() {
  const [fileName, setFileName] = useState<string>("");
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [originalFileContent, setOriginalFileContent] = useState<string>("");

  const handleFileUpload = async (file: File) => {
    const content = await file.text();
    setOriginalFileContent(content);
    const parsed = parseASSFile(content);
    setFileName(file.name);
    setSubtitles(parsed);
    setSelectedIndices(new Set());
  };

  const handleExport = () => {
    if (!originalFileContent) return;

    const exported = exportASSFile(originalFileContent, subtitles);
    const blob = new Blob([exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "subtitles.ass";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTimeAdjustment = (
    adjustment: number,
    unit: "milliseconds" | "seconds",
    applyTo: "start" | "end" | "both",
    scope: "selected" | "all"
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
      })
    );
  };

  const handleSubtitleUpdate = (
    index: number,
    updates: Partial<SubtitleLine>
  ) => {
    setSubtitles((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, ...updates } : sub))
    );
  };

  const handleSelectionChange = (indices: Set<number>) => {
    setSelectedIndices(indices);
  };

  return (
    <div className="flex flex-col h-full">
      <FileUploadSection
        fileName={fileName}
        totalLines={subtitles.length}
        onFileUpload={handleFileUpload}
        onExport={handleExport}
        hasFile={subtitles.length > 0}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden min-h-0">
        <TimeAdjustmentPanel
          onApply={handleTimeAdjustment}
          selectedCount={selectedIndices.size}
          totalCount={subtitles.length}
        />

        <div className="flex-1 flex flex-col min-h-0">
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
    </div>
  );
}
