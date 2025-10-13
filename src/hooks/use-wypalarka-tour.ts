import { useState, useEffect } from "react";
import { CallBackProps, STATUS } from "react-joyride";

const TOUR_STORAGE_KEY = "wypalarka-tour-completed";

export function useWypalarkaTour() {
  const [runTour, setRunTour] = useState(false);

  // Check if user has completed the tour before
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRunTour(true), 500);
    }
  }, []);

  // Handle tour callback
  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  };

  // Function to restart tour
  const restartTour = () => {
    setRunTour(true);
    localStorage.setItem(TOUR_STORAGE_KEY, "false");
  };

  return {
    runTour,
    handleTourCallback,
    restartTour,
  };
}
