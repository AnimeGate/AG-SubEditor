export interface SubtitleLine {
  startMs: number;
  endMs: number;
  style: string;
  text: string;
  layer?: number;
  name?: string;
  marginL?: number;
  marginR?: number;
  marginV?: number;
  effect?: string;
}

export function parseASSFile(content: string): SubtitleLine[] {
  const lines = content.split("\n");
  const subtitles: SubtitleLine[] = [];
  let inEventsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "[Events]") {
      inEventsSection = true;
      continue;
    }

    if (trimmed.startsWith("[") && trimmed !== "[Events]") {
      inEventsSection = false;
      continue;
    }

    if (inEventsSection && trimmed.startsWith("Dialogue:")) {
      const parts = trimmed.substring(9).split(",");

      if (parts.length >= 9) {
        const layer = Number.parseInt(parts[0].trim());
        const start = parseASSTime(parts[1].trim());
        const end = parseASSTime(parts[2].trim());
        const style = parts[3].trim();
        const name = parts[4].trim();
        const marginL = Number.parseInt(parts[5].trim());
        const marginR = Number.parseInt(parts[6].trim());
        const marginV = Number.parseInt(parts[7].trim());
        const effect = parts[8].trim();
        const text = parts.slice(9).join(",").trim();

        subtitles.push({
          startMs: start,
          endMs: end,
          style,
          text,
          layer,
          name,
          marginL,
          marginR,
          marginV,
          effect,
        });
      }
    }
  }

  return subtitles;
}

export function exportASSFile(
  originalContent: string,
  subtitles: SubtitleLine[],
): string {
  const lines = originalContent.split("\n");
  const result: string[] = [];
  let inEventsSection = false;
  let dialogueIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "[Events]") {
      inEventsSection = true;
      result.push(line);
      continue;
    }

    if (trimmed.startsWith("[") && trimmed !== "[Events]") {
      inEventsSection = false;
    }

    if (inEventsSection && trimmed.startsWith("Dialogue:")) {
      if (dialogueIndex < subtitles.length) {
        const sub = subtitles[dialogueIndex];
        const newLine = `Dialogue: ${sub.layer || 0},${formatASSTime(sub.startMs)},${formatASSTime(sub.endMs)},${sub.style},${sub.name || ""},${sub.marginL || 0},${sub.marginR || 0},${sub.marginV || 0},${sub.effect || ""},${sub.text}`;
        result.push(newLine);
        dialogueIndex++;
      }
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

function parseASSTime(timeStr: string): number {
  // Format: H:MM:SS.CS (centiseconds)
  const parts = timeStr.split(":");
  if (parts.length !== 3) return 0;

  const hours = Number.parseInt(parts[0]);
  const minutes = Number.parseInt(parts[1]);
  const secondsParts = parts[2].split(".");
  const seconds = Number.parseInt(secondsParts[0]);
  const centiseconds = Number.parseInt(secondsParts[1] || "0");

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + centiseconds * 10;
}

function formatASSTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}
