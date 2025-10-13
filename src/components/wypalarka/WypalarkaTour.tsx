import Joyride, { CallBackProps } from "react-joyride";
import { WypalarkaTourTooltip } from "./WypalarkaTourTooltip";
import { getWypalarkaTourSteps } from "./WypalarkaTourConfig";
import { useTranslation } from "react-i18next";

interface WypalarkaTourProps {
  run: boolean;
  onCallback: (data: CallBackProps) => void;
  onStepChange?: (index: number) => void;
}

export function WypalarkaTour({ run, onCallback, onStepChange }: WypalarkaTourProps) {
  const { t } = useTranslation();

  return (
    <Joyride
      steps={getWypalarkaTourSteps(t)}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={(data) => {
        // Notify about step changes for auto-opening dialogs
        if (data.action === "next" || data.action === "prev") {
          onStepChange?.(data.index);
        }
        onCallback(data);
      }}
      tooltipComponent={WypalarkaTourTooltip}
      scrollToFirstStep
      scrollOffset={100}
      disableScrolling={false}
      disableScrollParentFix={false}
      spotlightClicks={false}
      spotlightPadding={8}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: "hsl(var(--background))",
          primaryColor: "hsl(var(--primary))",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        spotlight: {
          borderRadius: "8px",
        },
      }}
      floaterProps={{
        disableAnimation: false,
        offset: 12,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  );
}
