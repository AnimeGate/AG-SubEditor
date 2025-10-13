import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SubtitleLine } from "@/lib/ass-parser";
import { formatTime, parseTimeToMs } from "@/lib/time-utils";
import { useTranslation } from "react-i18next";

interface SubtitleGridProps {
  subtitles: SubtitleLine[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
  onSubtitleUpdate: (index: number, updates: Partial<SubtitleLine>) => void;
}

export function SubtitleGrid({
  subtitles,
  selectedIndices,
  onSelectionChange,
  onSubtitleUpdate,
}: SubtitleGridProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const { t } = useTranslation();

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === subtitles.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(subtitles.map((_, i) => i)));
    }
  };

  const handleCellEdit = (index: number, field: string, value: string) => {
    if (field === "start") {
      const ms = parseTimeToMs(value);
      if (ms !== null) {
        onSubtitleUpdate(index, { startMs: ms });
      }
    } else if (field === "end") {
      const ms = parseTimeToMs(value);
      if (ms !== null) {
        onSubtitleUpdate(index, { endMs: ms });
      }
    } else if (field === "text") {
      onSubtitleUpdate(index, { text: value });
    } else if (field === "style") {
      onSubtitleUpdate(index, { style: value });
    }
    setEditingCell(null);
  };

  const allSelected = subtitles.length > 0 && selectedIndices.size === subtitles.length;

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      <div className="flex gap-2 p-3 border-b">
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allSelected ? t("deselectAll") : t("selectAll")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange(new Set())}
          disabled={selectedIndices.size === 0}
        >
          {t("clearSelection")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b">
              <th className="p-3 text-left w-12">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              </th>
              <th className="p-3 text-left w-16 font-semibold">{t("lineNumber")}</th>
              <th className="p-3 text-left w-32 font-semibold">{t("startTime")}</th>
              <th className="p-3 text-left w-32 font-semibold">{t("endTime")}</th>
              <th className="p-3 text-left w-24 font-semibold">{t("duration")}</th>
              <th className="p-3 text-left w-32 font-semibold">{t("style")}</th>
              <th className="p-3 text-left font-semibold">{t("text")}</th>
            </tr>
          </thead>
          <tbody>
            {subtitles.map((subtitle, index) => {
              const isSelected = selectedIndices.has(index);
              const duration = ((subtitle.endMs - subtitle.startMs) / 1000).toFixed(
                2
              );

              return (
                <tr
                  key={index}
                  className={`border-b hover:bg-accent/50 transition-colors ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/30"
                  } ${isSelected ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(index)}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">{index + 1}</td>
                  <td
                    className="p-3 font-mono text-sm cursor-pointer hover:bg-accent"
                    onDoubleClick={() =>
                      setEditingCell({ row: index, col: "start" })
                    }
                  >
                    {editingCell?.row === index && editingCell?.col === "start" ? (
                      <Input
                        autoFocus
                        defaultValue={formatTime(subtitle.startMs)}
                        onBlur={(e) =>
                          handleCellEdit(index, "start", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellEdit(index, "start", e.currentTarget.value);
                          }
                        }}
                        className="h-8 font-mono"
                      />
                    ) : (
                      formatTime(subtitle.startMs)
                    )}
                  </td>
                  <td
                    className="p-3 font-mono text-sm cursor-pointer hover:bg-accent"
                    onDoubleClick={() =>
                      setEditingCell({ row: index, col: "end" })
                    }
                  >
                    {editingCell?.row === index && editingCell?.col === "end" ? (
                      <Input
                        autoFocus
                        defaultValue={formatTime(subtitle.endMs)}
                        onBlur={(e) =>
                          handleCellEdit(index, "end", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellEdit(index, "end", e.currentTarget.value);
                          }
                        }}
                        className="h-8 font-mono"
                      />
                    ) : (
                      formatTime(subtitle.endMs)
                    )}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono"
                    >
                      {duration}s
                    </Badge>
                  </td>
                  <td
                    className="p-3 text-sm cursor-pointer hover:bg-accent"
                    onDoubleClick={() =>
                      setEditingCell({ row: index, col: "style" })
                    }
                  >
                    {editingCell?.row === index && editingCell?.col === "style" ? (
                      <Input
                        autoFocus
                        defaultValue={subtitle.style}
                        onBlur={(e) =>
                          handleCellEdit(index, "style", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellEdit(index, "style", e.currentTarget.value);
                          }
                        }}
                        className="h-8"
                      />
                    ) : (
                      subtitle.style
                    )}
                  </td>
                  <td
                    className="p-3 text-sm cursor-pointer hover:bg-accent max-w-md"
                    onDoubleClick={() =>
                      setEditingCell({ row: index, col: "text" })
                    }
                  >
                    {editingCell?.row === index && editingCell?.col === "text" ? (
                      <Input
                        autoFocus
                        defaultValue={subtitle.text}
                        onBlur={(e) =>
                          handleCellEdit(index, "text", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCellEdit(index, "text", e.currentTarget.value);
                          }
                        }}
                        className="h-8"
                      />
                    ) : (
                      <div className="line-clamp-2">{subtitle.text}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
