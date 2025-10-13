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
    subtitles.length > 0 ? Math.max(...subtitles.map((s) => s.endMs)) / 1000 : 0;

  const earliestStart =
    subtitles.length > 0 ? Math.min(...subtitles.map((s) => s.startMs)) : 0;

  const latestEnd =
    subtitles.length > 0 ? Math.max(...subtitles.map((s) => s.endMs)) : 0;

  return (
    <div className="border-t bg-card px-6 py-4 flex-shrink-0 shadow-lg">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-primary">{selectedCount}</span>
          <span className="text-muted-foreground">{t("linesSelected")}</span>
        </div>

        {totalCount > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("total")}:</span>
              <span className="font-semibold text-base">
                {totalCount} {t("lines")}
              </span>
            </div>

            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {t("totalDuration")}:
              </span>
              <span className="font-mono font-semibold text-base">
                {totalDuration.toFixed(2)}s
              </span>
            </div>

            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("range")}:</span>
              <span className="font-mono font-semibold text-base">
                {formatTime(earliestStart)} → {formatTime(latestEnd)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
