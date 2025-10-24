import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SubtitleLine } from "@/lib/ass-parser";
import type { TimingMatchResult } from "@/lib/timing-sync-utils";
import { formatTime } from "@/lib/time-utils";
import { formatTimeDifference } from "@/lib/timing-sync-utils";
import { useTranslation } from "react-i18next";

interface TimingComparisonTableProps {
  source: SubtitleLine[];
  matches: TimingMatchResult[];
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
}

export function TimingComparisonTable({
  source,
  matches,
  selectedIndices,
  onSelectionChange,
}: TimingComparisonTableProps) {
  const { t } = useTranslation();

  const toggleSelection = (index: number) => {
    if (!matches[index]?.hasMatch) return; // Don't allow selection if no match

    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange(newSelection);
  };

  const toggleSelectAll = () => {
    const matchedIndices = matches
      .map((match, index) => (match.hasMatch ? index : -1))
      .filter((index) => index !== -1);

    if (selectedIndices.size === matchedIndices.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(matchedIndices));
    }
  };

  const matchedCount = matches.filter((m) => m.hasMatch).length;
  const allMatchedSelected = matchedCount > 0 && selectedIndices.size === matchedCount;

  return (
    <div className="flex flex-col h-[400px] border rounded-lg bg-card">
      <div className="flex gap-2 p-3 border-b">
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allMatchedSelected ? t("deselectAll") : t("selectAll")}
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

      <ScrollArea className="flex-1">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b">
              <th className="p-3 text-left w-12">
                <Checkbox
                  checked={allMatchedSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 text-left w-16 font-semibold">#</th>
              <th className="p-3 text-left w-28 font-semibold">
                {t("currentTime")}
              </th>
              <th className="p-3 text-left w-28 font-semibold">{t("newTime")}</th>
              <th className="p-3 text-left w-24 font-semibold">
                {t("difference")}
              </th>
              <th className="p-3 text-left font-semibold">{t("text")}</th>
            </tr>
          </thead>
          <tbody>
            {source.map((sourceLine, index) => {
              const match = matches[index];
              const isSelected = selectedIndices.has(index);
              const hasMatch = match?.hasMatch ?? false;

              return (
                <tr
                  key={index}
                  className={`border-b hover:bg-muted/50 transition-colors ${
                    isSelected ? "bg-blue-500/20" : index % 2 === 0 ? "bg-muted/30" : ""
                  } ${!hasMatch ? "opacity-50" : ""}`}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(index)}
                      disabled={!hasMatch}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">{index + 1}</td>
                  <td className="p-3 font-mono text-sm">
                    {formatTime(sourceLine.startMs)}
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {hasMatch && match.referenceLine
                      ? formatTime(match.referenceLine.startMs)
                      : "-"}
                  </td>
                  <td
                    className={`p-3 font-mono text-sm font-semibold ${
                      hasMatch
                        ? match.timeDiffMs > 0
                          ? "text-red-500"
                          : match.timeDiffMs < 0
                            ? "text-green-500"
                            : "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {hasMatch ? formatTimeDifference(match.timeDiffMs) : "-"}
                  </td>
                  <td className="p-3 text-sm truncate max-w-xs">
                    {sourceLine.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
