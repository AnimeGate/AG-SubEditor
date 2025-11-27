import type { SubtitleLine } from "@/lib/ass-parser";
import { formatTime } from "@/lib/time-utils";
import { useTranslation } from "react-i18next";

interface InfoBarProps {
  selectedCount: number;
  totalCount: number;
  subtitles: SubtitleLine[];
}

export function InfoBar({
  selectedCount,
  totalCount,
  subtitles,
}: InfoBarProps) {
  const { t } = useTranslation();
  const totalDuration =
    subtitles.length > 0
      ? Math.max(...subtitles.map((s) => s.endMs)) / 1000
      : 0;

  const earliestStart =
    subtitles.length > 0 ? Math.min(...subtitles.map((s) => s.startMs)) : 0;

  const latestEnd =
    subtitles.length > 0 ? Math.max(...subtitles.map((s) => s.endMs)) : 0;

  return (
    <div className="bg-card flex-shrink-0 border-t px-6 py-4 shadow-lg">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-primary text-lg font-bold">
            {selectedCount}
          </span>
          <span className="text-muted-foreground">{t("linesSelected")}</span>
        </div>

        {totalCount > 0 && (
          <>
            <div className="bg-border h-6 w-px" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("total")}:</span>
              <span className="text-base font-semibold">
                {totalCount} {t("lines")}
              </span>
            </div>

            <div className="bg-border h-6 w-px" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("totalDuration")}:
              </span>
              <span className="font-mono text-base font-semibold">
                {totalDuration.toFixed(2)}s
              </span>
            </div>

            <div className="bg-border h-6 w-px" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("range")}:</span>
              <span className="font-mono text-base font-semibold">
                {formatTime(earliestStart)} → {formatTime(latestEnd)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
