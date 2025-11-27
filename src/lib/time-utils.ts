export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function parseTimeToMs(timeStr: string): number | null {
  // Format: H:MM:SS.CS or variations
  const parts = timeStr.split(":");
  if (parts.length !== 3) return null;

  try {
    const hours = Number.parseInt(parts[0]);
    const minutes = Number.parseInt(parts[1]);
    const secondsParts = parts[2].split(".");
    const seconds = Number.parseInt(secondsParts[0]);
    const centiseconds = Number.parseInt(secondsParts[1] || "0");

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      isNaN(seconds) ||
      isNaN(centiseconds)
    ) {
      return null;
    }

    return (hours * 3600 + minutes * 60 + seconds) * 1000 + centiseconds * 10;
  } catch {
    return null;
  }
}
