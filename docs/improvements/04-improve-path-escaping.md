# Improve FFmpeg Path Escaping

## Overview

The current path escaping logic for FFmpeg's subtitles filter is fragile and may fail with certain special characters. This improvement adds robust escaping following FFmpeg's filter escaping rules.

## Current Behavior

**Location:** `src/lib/ffmpeg-processor.ts:362-365`

```typescript
const escapedSubtitlePath = subtitlePath
  .replace(/\\/g, "\\\\\\\\")  // 4 backslashes - unclear why
  .replace(/:/g, "\\:")
  .replace(/'/g, "\\'");
```

**Problems:**
1. Excessive backslash escaping (4x) with no documentation
2. Missing escaping for: `[`, `]`, `;`, `,`, `=`, newlines
3. No handling of Unicode characters
4. Different escaping rules for different filter contexts

## FFmpeg Filter Escaping Rules

FFmpeg has multiple escaping layers:

1. **Shell escaping** - Not needed since we use spawn() with array
2. **FFmpeg option parsing** - Handles `-vf` argument
3. **Filter graph parsing** - Parses filter chain syntax
4. **Filter-specific parsing** - The subtitles filter parses its path

### Subtitles Filter Escaping

The `subtitles` filter uses libass which has its own path parsing. Characters that need escaping:

| Character | Escape Sequence | Reason |
|-----------|-----------------|--------|
| `\` | `\\\\` | Path separator (Windows) |
| `:` | `\\:` | Drive letter separator (Windows) |
| `'` | `\\'` | String delimiter |
| `[` | `\\[` | Filter graph syntax |
| `]` | `\\]` | Filter graph syntax |
| `;` | `\\;` | Filter separator |
| `,` | `\\,` | Option separator |
| `=` | `\\=` | Key-value separator |

## Proposed Solution

### Implementation

**File:** `src/lib/ffmpeg-processor.ts`

```typescript
/**
 * Escapes a file path for use in FFmpeg's subtitles filter.
 *
 * FFmpeg filter escaping has multiple layers:
 * 1. Filter graph parser: handles ; , [ ] =
 * 2. Subtitles filter: handles file paths with libass
 *
 * On Windows, backslashes need quadruple escaping:
 * - Original: C:\path\file.ass
 * - After JS string: C:\\path\\file.ass (2 backslashes in memory)
 * - For FFmpeg filter: C:\\\\path\\\\file.ass (4 backslashes needed)
 *
 * This is because:
 * - FFmpeg's filter parser unescapes once: \\\\ -> \\
 * - libass unescapes again: \\ -> \
 *
 * @param filePath - The absolute path to the subtitle file
 * @returns Escaped path safe for use in subtitles filter
 */
function escapeSubtitlePath(filePath: string): string {
  return filePath
    // Step 1: Escape backslashes first (must be done before other escapes)
    // Windows paths need 4 backslashes due to double unescaping
    .replace(/\\/g, "\\\\\\\\")
    // Step 2: Escape colons (Windows drive letters like C:)
    .replace(/:/g, "\\:")
    // Step 3: Escape single quotes (string delimiters)
    .replace(/'/g, "\\'")
    // Step 4: Escape filter graph special characters
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/=/g, "\\=");
}

/**
 * Validates that a path is safe for FFmpeg processing.
 *
 * @param filePath - Path to validate
 * @returns Object with isValid flag and optional error message
 */
function validatePathForFFmpeg(filePath: string): { isValid: boolean; error?: string } {
  // Check for newlines (could break command)
  if (filePath.includes("\n") || filePath.includes("\r")) {
    return { isValid: false, error: "Path contains newline characters" };
  }

  // Check for null bytes
  if (filePath.includes("\0")) {
    return { isValid: false, error: "Path contains null bytes" };
  }

  // Check path length (Windows MAX_PATH = 260, but can be longer with \\?\ prefix)
  if (filePath.length > 32767) {
    return { isValid: false, error: "Path exceeds maximum length" };
  }

  // Check for problematic Unicode characters
  // Some Unicode characters look like ASCII but are different (homoglyphs)
  const hasProblematicUnicode = /[\u200B-\u200F\u2028-\u202F\uFEFF]/.test(filePath);
  if (hasProblematicUnicode) {
    return { isValid: false, error: "Path contains invisible Unicode characters" };
  }

  return { isValid: true };
}
```

### Integration

Update the `buildFFmpegArgs` method:

```typescript
private buildFFmpegArgs(): string[] {
  const args: string[] = [];

  // ... existing code ...

  // Validate paths before building command
  const subtitleValidation = validatePathForFFmpeg(this.subtitlePath);
  if (!subtitleValidation.isValid) {
    throw new Error(`Invalid subtitle path: ${subtitleValidation.error}`);
  }

  const videoValidation = validatePathForFFmpeg(this.videoPath);
  if (!videoValidation.isValid) {
    throw new Error(`Invalid video path: ${videoValidation.error}`);
  }

  const outputValidation = validatePathForFFmpeg(this.outputPath);
  if (!outputValidation.isValid) {
    throw new Error(`Invalid output path: ${outputValidation.error}`);
  }

  // Build filter with properly escaped path
  const escapedSubtitlePath = escapeSubtitlePath(this.subtitlePath);
  vfParts.push(`subtitles='${escapedSubtitlePath}'`);

  // ... rest of method ...
}
```

### Unit Tests

**File:** `src/tests/unit/ffmpeg-path-escaping.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { escapeSubtitlePath, validatePathForFFmpeg } from "@/lib/ffmpeg-processor";

describe("escapeSubtitlePath", () => {
  it("escapes Windows paths correctly", () => {
    const input = "C:\\Users\\test\\subtitles.ass";
    const expected = "C\\\\:\\\\Users\\\\test\\\\subtitles.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("escapes paths with spaces", () => {
    const input = "C:\\Users\\My Documents\\subtitles.ass";
    const expected = "C\\\\:\\\\Users\\\\My Documents\\\\subtitles.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("escapes paths with single quotes", () => {
    const input = "C:\\Users\\test's folder\\subtitles.ass";
    const expected = "C\\\\:\\\\Users\\\\test\\'s folder\\\\subtitles.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("escapes paths with brackets", () => {
    const input = "C:\\Videos\\[Group] Show - 01.ass";
    const expected = "C\\\\:\\\\Videos\\\\\\[Group\\] Show - 01.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("escapes paths with filter syntax characters", () => {
    const input = "C:\\test;file,name=value.ass";
    const expected = "C\\\\:\\\\test\\;file\\,name\\=value.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("handles Unix-style paths", () => {
    const input = "/home/user/subtitles.ass";
    const expected = "/home/user/subtitles.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("handles UNC paths", () => {
    const input = "\\\\server\\share\\subtitles.ass";
    const expected = "\\\\\\\\\\\\\\\\server\\\\\\\\share\\\\\\\\subtitles.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("handles Japanese characters", () => {
    const input = "C:\\動画\\字幕.ass";
    const expected = "C\\\\:\\\\動画\\\\字幕.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });

  it("handles emoji in filenames", () => {
    const input = "C:\\Videos\\🎬 Movie.ass";
    const expected = "C\\\\:\\\\Videos\\\\🎬 Movie.ass";
    expect(escapeSubtitlePath(input)).toBe(expected);
  });
});

describe("validatePathForFFmpeg", () => {
  it("accepts valid paths", () => {
    expect(validatePathForFFmpeg("C:\\Users\\test.ass").isValid).toBe(true);
  });

  it("rejects paths with newlines", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\ninjection.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("newline");
  });

  it("rejects paths with carriage returns", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\rinjection.ass");
    expect(result.isValid).toBe(false);
  });

  it("rejects paths with null bytes", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\0injection.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("null");
  });

  it("rejects paths with zero-width characters", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\u200Bfile.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("invisible");
  });
});
```

### Error Handling Improvement

When path validation fails, provide clear error messages to the user:

**File:** `src/components/wypalarka/Wypalarka.tsx`

```typescript
const handleStartProcess = async () => {
  try {
    await window.ffmpegAPI.startProcess(videoPath, subtitlePath, outputPath, settings);
  } catch (error) {
    if (error.message.includes("Invalid subtitle path")) {
      // Show user-friendly error
      setError(t("wypalarka.errors.invalidSubtitlePath", {
        reason: error.message.split(": ")[1]
      }));
    } else if (error.message.includes("Invalid video path")) {
      setError(t("wypalarka.errors.invalidVideoPath"));
    } else {
      setError(error.message);
    }
  }
};
```

### Documentation

Add inline documentation explaining the escaping:

```typescript
/**
 * FFmpeg Subtitle Filter Path Escaping
 * =====================================
 *
 * The subtitles filter in FFmpeg requires careful path escaping due to
 * multiple parsing layers:
 *
 * Layer 1: FFmpeg option parser
 *   -vf "subtitles='C:\\path\\file.ass'"
 *   The outer quotes protect the entire filter string
 *
 * Layer 2: Filter graph parser
 *   Parses: subtitles='C:\\path\\file.ass'
 *   Special chars: [ ] ; , = ' need escaping with backslash
 *
 * Layer 3: Subtitles filter (libass)
 *   Receives: C:\path\file.ass (after unescaping)
 *   On Windows, backslashes are path separators
 *
 * Escaping chain for backslash on Windows:
 *   Original file:     C:\path\file.ass
 *   In JS string:      "C:\\path\\file.ass" (2 backslashes)
 *   Escaped for FFmpeg: "C\\\\:\\\\path\\\\file.ass" (4 backslashes)
 *   After filter parse: C\\path\\file.ass (2 backslashes)
 *   After libass parse: C:\path\file.ass (1 backslash - correct!)
 */
```

## Testing Checklist

- [ ] Windows path with spaces: `C:\Program Files\test.ass`
- [ ] Windows path with brackets: `C:\[Group] Show\file.ass`
- [ ] Windows path with quotes: `C:\User's Files\test.ass`
- [ ] Windows path with colons: `C:\test:file.ass` (should fail - invalid Windows filename)
- [ ] UNC path: `\\server\share\file.ass`
- [ ] Path with Japanese: `C:\動画\字幕.ass`
- [ ] Path with emoji: `C:\🎬 Movies\subs.ass`
- [ ] Path with semicolon: `C:\test;folder\file.ass`
- [ ] Newline injection attempt (should be rejected)
- [ ] Null byte injection attempt (should be rejected)

## Files to Modify

1. `src/lib/ffmpeg-processor.ts` - Update escaping logic
2. `src/tests/unit/ffmpeg-path-escaping.test.ts` - New test file
3. `src/localization/i18n.ts` - Add error message translations

## Security Considerations

This improvement addresses potential security issues:

1. **Path Traversal**: Not directly addressed (OS handles this)
2. **Command Injection**: Mitigated by spawn() array form + validation
3. **Filter Injection**: Mitigated by escaping special filter chars
4. **Unicode Homoglyphs**: Detected and rejected

The validation layer adds defense-in-depth by rejecting paths that could cause unexpected behavior even if escaping is correct.
