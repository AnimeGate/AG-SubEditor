import type { SubtitleLine } from "./ass-parser";

/**
 * Result of matching a source line with a reference line
 */
export interface TimingMatchResult {
  sourceIndex: number;
  referenceLine: SubtitleLine | null;
  hasMatch: boolean;
  timeDiffMs: number; // Difference in start time (reference - current)
}

/**
 * Match subtitle lines by index (1:1 mapping)
 * @param source - Current subtitle lines
 * @param reference - Reference subtitle lines with desired timing
 * @returns Array of match results for each source line
 */
export function matchSubtitleLinesByIndex(
  source: SubtitleLine[],
  reference: SubtitleLine[],
): TimingMatchResult[] {
  return source.map((sourceLine, index) => {
    const referenceLine = reference[index] || null;
    const hasMatch = index < reference.length;
    const timeDiffMs = hasMatch
      ? referenceLine!.startMs - sourceLine.startMs
      : 0;

    return {
      sourceIndex: index,
      referenceLine,
      hasMatch,
      timeDiffMs,
    };
  });
}

/**
 * Apply reference timing to source lines for selected indices
 * @param source - Current subtitle lines
 * @param matches - Match results from matchSubtitleLinesByIndex
 * @param selectedIndices - Set of indices to apply timing to
 * @returns New array of subtitle lines with updated timing
 */
export function applyReferenceTiming(
  source: SubtitleLine[],
  matches: TimingMatchResult[],
  selectedIndices: Set<number>,
): SubtitleLine[] {
  return source.map((line, index) => {
    // Only apply if selected and has a match
    if (!selectedIndices.has(index)) {
      return line;
    }

    const match = matches[index];
    if (!match?.hasMatch || !match.referenceLine) {
      return line;
    }

    // Apply reference timing while preserving all other properties
    return {
      ...line,
      startMs: match.referenceLine.startMs,
      endMs: match.referenceLine.endMs,
    };
  });
}

/**
 * Format time difference for display
 * @param diffMs - Time difference in milliseconds
 * @returns Formatted string like "+0.50s" or "-0.20s"
 */
export function formatTimeDifference(diffMs: number): string {
  const sign = diffMs >= 0 ? "+" : "";
  const seconds = (diffMs / 1000).toFixed(2);
  return `${sign}${seconds}s`;
}

/**
 * Get statistics about matching results
 * @param matches - Array of match results
 * @returns Statistics object
 */
export function getMatchingStatistics(matches: TimingMatchResult[]): {
  total: number;
  matched: number;
  unmatched: number;
  percentage: number;
} {
  const total = matches.length;
  const matched = matches.filter((m) => m.hasMatch).length;
  const unmatched = total - matched;
  const percentage = total > 0 ? Math.round((matched / total) * 100) : 0;

  return { total, matched, unmatched, percentage };
}
