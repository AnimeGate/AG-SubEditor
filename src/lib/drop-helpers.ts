/**
 * Extract file paths from dropped File objects.
 * In Electron, File objects have a `path` property with the full filesystem path.
 */
export function getDroppedFilePaths(files: File[]): string[] {
  return files
    .map((file) => (file as File & { path: string }).path)
    .filter(Boolean);
}

/**
 * Categorize dropped files by type.
 */
export function categorizeDroppedFiles(files: File[]): {
  videos: string[];
  subtitles: string[];
  other: string[];
} {
  const videoExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".webm",
    ".m4v",
    ".wmv",
    ".flv",
  ];
  const subtitleExtensions = [".ass", ".srt", ".sub", ".ssa", ".vtt"];

  const result = {
    videos: [] as string[],
    subtitles: [] as string[],
    other: [] as string[],
  };

  for (const file of files) {
    const path = (file as File & { path: string }).path;
    if (!path) continue;

    const ext = "." + path.split(".").pop()?.toLowerCase();

    if (videoExtensions.includes(ext)) {
      result.videos.push(path);
    } else if (subtitleExtensions.includes(ext)) {
      result.subtitles.push(path);
    } else {
      result.other.push(path);
    }
  }

  return result;
}

/**
 * Auto-pair videos with subtitles by matching filenames.
 *
 * Matching strategy:
 * 1. Exact base name match: video.mkv + video.ass
 * 2. Video contains subtitle name: video_1080p.mkv + video.ass
 * 3. Subtitle contains video name: video.mkv + video_eng.ass
 */
export function autoPairFiles(
  videos: string[],
  subtitles: string[],
): { paired: { video: string; subtitle: string }[]; unpaired: string[] } {
  const paired: { video: string; subtitle: string }[] = [];
  const usedSubtitles = new Set<string>();
  const unpaired: string[] = [];

  for (const video of videos) {
    const videoBase = getBaseName(video).toLowerCase();

    // Try to find matching subtitle
    let matchedSubtitle: string | null = null;

    for (const subtitle of subtitles) {
      if (usedSubtitles.has(subtitle)) continue;

      const subBase = getBaseName(subtitle).toLowerCase();

      // Strategy 1: Exact match
      if (videoBase === subBase) {
        matchedSubtitle = subtitle;
        break;
      }

      // Strategy 2: Video contains subtitle name
      if (videoBase.includes(subBase)) {
        matchedSubtitle = subtitle;
        break;
      }

      // Strategy 3: Subtitle contains video name
      if (subBase.includes(videoBase)) {
        matchedSubtitle = subtitle;
        break;
      }
    }

    if (matchedSubtitle) {
      paired.push({ video, subtitle: matchedSubtitle });
      usedSubtitles.add(matchedSubtitle);
    } else {
      unpaired.push(video);
    }
  }

  return { paired, unpaired };
}

function getBaseName(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() || "";
  return fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
}

/**
 * Get file name from path (cross-platform).
 */
export function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
}
