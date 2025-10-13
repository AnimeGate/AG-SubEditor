import type { Step } from "react-joyride";

export const TOUR_STORAGE_KEY = "wypalarka-tour-completed";

export const getWypalarkaTourSteps = (t: (key: string) => string): Step[] => [
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("tourWelcomeTitle")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("tourWelcomeDesc")}
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="video-file"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourVideoFileTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourVideoFileDesc")}
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="subtitle-file"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourSubtitleFileTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourSubtitleFileDesc")}
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="output-file"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourOutputFileTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourOutputFileDesc")}
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="settings-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourSettingsTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourSettingsDesc")}
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="quality-preset"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourQualityTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourQualityDesc")}
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="gpu-acceleration"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourGpuTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourGpuDesc")}
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="start-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourStartTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourStartDesc")}
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="progress-panel"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold">{t("tourProgressTitle")}</h4>
        <p className="text-muted-foreground text-sm">
          {t("tourProgressDesc")}
        </p>
      </div>
    ),
    placement: "left",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("tourCompleteTitle")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("tourCompleteDesc")}
        </p>
      </div>
    ),
    placement: "center",
  },
];
