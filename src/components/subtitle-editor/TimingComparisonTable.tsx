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
  const allMatchedSelected =
    matchedCount > 0 && selectedIndices.size === matchedCount;

  return (
    <div className="bg-card flex h-[400px] flex-col rounded-lg border">
      <div className="flex gap-2 border-b p-3">
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
          <thead className="bg-muted sticky top-0 z-10">
            <tr className="border-b">
              <th className="w-12 p-3 text-left">
                <Checkbox
                  checked={allMatchedSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="w-16 p-3 text-left font-semibold">#</th>
              <th className="w-28 p-3 text-left font-semibold">
                {t("currentTime")}
              </th>
              <th className="w-28 p-3 text-left font-semibold">
                {t("newTime")}
              </th>
              <th className="w-24 p-3 text-left font-semibold">
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
                  className={`hover:bg-muted/50 border-b transition-colors ${
                    isSelected
                      ? "bg-blue-500/20"
                      : index % 2 === 0
                        ? "bg-muted/30"
                        : ""
                  } ${!hasMatch ? "opacity-50" : ""}`}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(index)}
                      disabled={!hasMatch}
                    />
                  </td>
                  <td className="text-muted-foreground p-3">{index + 1}</td>
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
                  <td className="max-w-xs truncate p-3 text-sm">
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
