import { describe, it, expect } from "vitest";
import {
  escapeSubtitlePath,
  validatePathForFFmpeg,
} from "@/lib/ffmpeg-processor";

describe("escapeSubtitlePath", () => {
  it("escapes Windows paths correctly", () => {
    const input = "C:\\Users\\test\\subtitles.ass";
    const result = escapeSubtitlePath(input);
    // Should have 4 backslashes for each original backslash
    expect(result).toContain("\\\\\\\\");
    expect(result).toContain("\\:");
  });

  it("escapes paths with spaces", () => {
    const input = "C:\\Users\\My Documents\\subtitles.ass";
    const result = escapeSubtitlePath(input);
    // Spaces should remain unchanged
    expect(result).toContain("My Documents");
    expect(result).toContain("\\\\\\\\");
  });

  it("escapes paths with single quotes", () => {
    const input = "C:\\Users\\test's folder\\subtitles.ass";
    const result = escapeSubtitlePath(input);
    expect(result).toContain("\\'");
  });

  it("escapes paths with brackets", () => {
    const input = "C:\\Videos\\[Group] Show - 01.ass";
    const result = escapeSubtitlePath(input);
    expect(result).toContain("\\[");
    expect(result).toContain("\\]");
  });

  it("escapes paths with filter syntax characters", () => {
    const input = "C:\\test;file,name=value.ass";
    const result = escapeSubtitlePath(input);
    expect(result).toContain("\\;");
    expect(result).toContain("\\,");
    expect(result).toContain("\\=");
  });

  it("handles Unix-style paths without modification of slashes", () => {
    const input = "/home/user/subtitles.ass";
    const result = escapeSubtitlePath(input);
    // Forward slashes should remain unchanged
    expect(result).toBe("/home/user/subtitles.ass");
  });

  it("handles Japanese characters", () => {
    const input = "C:\\動画\\字幕.ass";
    const result = escapeSubtitlePath(input);
    // Japanese characters should remain unchanged
    expect(result).toContain("動画");
    expect(result).toContain("字幕");
    expect(result).toContain("\\\\\\\\");
  });

  it("handles emoji in filenames", () => {
    const input = "C:\\Videos\\🎬 Movie.ass";
    const result = escapeSubtitlePath(input);
    // Emoji should remain unchanged
    expect(result).toContain("🎬");
  });

  it("escapes multiple special characters in one path", () => {
    const input = "C:\\[Test]\\file's;name,here=now.ass";
    const result = escapeSubtitlePath(input);
    expect(result).toContain("\\[");
    expect(result).toContain("\\]");
    expect(result).toContain("\\'");
    expect(result).toContain("\\;");
    expect(result).toContain("\\,");
    expect(result).toContain("\\=");
  });
});

describe("validatePathForFFmpeg", () => {
  it("accepts valid paths", () => {
    expect(validatePathForFFmpeg("C:\\Users\\test.ass").isValid).toBe(true);
    expect(validatePathForFFmpeg("/home/user/test.ass").isValid).toBe(true);
  });

  it("accepts paths with spaces", () => {
    expect(validatePathForFFmpeg("C:\\Program Files\\test.ass").isValid).toBe(true);
  });

  it("accepts paths with special characters", () => {
    expect(validatePathForFFmpeg("C:\\[Group] Show - 01.ass").isValid).toBe(true);
    expect(validatePathForFFmpeg("C:\\file's name.ass").isValid).toBe(true);
  });

  it("accepts paths with Unicode characters", () => {
    expect(validatePathForFFmpeg("C:\\動画\\字幕.ass").isValid).toBe(true);
    expect(validatePathForFFmpeg("C:\\🎬 Movies\\subs.ass").isValid).toBe(true);
  });

  it("rejects paths with newlines", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\ninjection.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("newline");
  });

  it("rejects paths with carriage returns", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\rinjection.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("newline");
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

  it("rejects paths with zero-width joiners", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\u200Dfile.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("invisible");
  });

  it("rejects paths with byte order marks", () => {
    const result = validatePathForFFmpeg("C:\\Users\\test\uFEFFfile.ass");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("invisible");
  });

  it("rejects extremely long paths", () => {
    const longPath = "C:\\" + "a".repeat(40000) + ".ass";
    const result = validatePathForFFmpeg(longPath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("maximum length");
  });

  it("accepts normal length paths", () => {
    const normalPath = "C:\\" + "a".repeat(200) + ".ass";
    expect(validatePathForFFmpeg(normalPath).isValid).toBe(true);
  });
});
