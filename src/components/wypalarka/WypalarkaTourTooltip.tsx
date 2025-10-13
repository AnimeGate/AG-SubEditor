import type { TooltipRenderProps } from "react-joyride";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function WypalarkaTourTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  const { t } = useTranslation();

  return (
    <Card
      {...(tooltipProps as any)}
      className="animate-in fade-in-0 zoom-in-95 w-full max-w-[90vw] border shadow-lg sm:max-w-md"
    >
      {/* Close button */}
      <button
        {...closeProps}
        className="ring-offset-background focus:ring-ring absolute right-2 top-2 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">{t("tourClose")}</span>
      </button>

      {/* Content */}
      <CardContent className="pb-4 pr-8 pt-6">
        {step.title && (
          <h3 className="mb-2 text-base font-semibold sm:text-lg">
            {step.title}
          </h3>
        )}
        <div className="text-xs sm:text-sm">{step.content}</div>
      </CardContent>

      {/* Footer with navigation */}
      <CardFooter className="flex flex-col items-stretch justify-between gap-2 border-t pt-3 sm:flex-row sm:items-center sm:gap-0 sm:pt-4">
        {/* Step indicator */}
        <div className="text-muted-foreground text-center text-xs sm:text-left">
          {index + 1} / {size}
        </div>

        <div className="flex items-center justify-end gap-2">
          {/* Skip button - only show if not last step */}
          {!isLastStep && (
            <Button
              {...skipProps}
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs sm:text-sm"
            >
              {t("tourSkip")}
            </Button>
          )}

          {/* Back button - only show if not first step */}
          {index > 0 && (
            <Button
              {...backProps}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {t("tourBack")}
            </Button>
          )}

          {/* Next/Finish button */}
          <Button
            {...primaryProps}
            size="sm"
            className="min-w-[70px] text-xs sm:min-w-[80px] sm:text-sm"
          >
            {isLastStep ? t("tourFinish") : t("tourNext")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
