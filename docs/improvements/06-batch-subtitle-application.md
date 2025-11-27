# Batch Subtitle Application

## Overview

Allow users to apply a single subtitle file to multiple video files in one operation. Currently, users must manually create video/subtitle pairs one-by-one in the queue dialog.

## Current Behavior

**Location:** `src/components/wypalarka/WypalarkaAddFilesDialog.tsx`

Users must:

1. Click "Add" button
2. Select one video file
3. Select one subtitle file
4. Set output path
5. Repeat for each video

**Problem:** Tedious when burning same subtitles into multiple video files (e.g., different quality versions of same video).

## Use Cases

1. **Multiple quality versions**: Same subtitles for 1080p, 720p, 4K versions
2. **Multiple episodes**: Same OP/ED subtitles for episode batch
3. **Language versions**: Same video, different subtitle languages (inverse use case)
4. **Re-encodes**: Applying updated subtitles to multiple previous encodes

## Proposed Solution

### User Flow

**New "Batch Mode" in Add Files Dialog:**

1. User clicks "Add Files" button in queue panel
2. Dialog shows toggle: "Single Pair" | "Batch Mode"
3. In Batch Mode:
   - User selects ONE subtitle file
   - User selects MULTIPLE video files
   - Preview shows all generated pairs with auto-named outputs
   - User can adjust output naming pattern
4. Click "Add to Queue" adds all pairs at once

### UI Design

```
┌─────────────────────────────────────────────────────────────┐
│  Add Files to Queue                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mode:  [Single Pair]  [Batch Mode]                         │
│                        ~~~~~~~~~~~~                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Subtitle File                                       │   │
│  │  ┌─────────────────────────────────────────┐  [📁]  │   │
│  │  │ C:\Subs\Episode.ass                     │        │   │
│  │  └─────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Video Files (3 selected)                   [📁+]   │   │
│  │  ├─ Episode_1080p.mkv                               │   │
│  │  ├─ Episode_720p.mkv                                │   │
│  │  └─ Episode_480p.mkv                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Output Pattern: [video_name]_subbed.mp4                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Preview (3 items)                                   │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Episode_1080p.mkv → Episode_1080p_subbed.mp4│    │   │
│  │  │ Episode_720p.mkv  → Episode_720p_subbed.mp4 │    │   │
│  │  │ Episode_480p.mkv  → Episode_480p_subbed.mp4 │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Add 3 to Queue]     │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### 1. Update Dialog State

**File:** `src/components/wypalarka/WypalarkaAddFilesDialog.tsx`

```typescript
type DialogMode = "single" | "batch";

interface BatchModeState {
  subtitlePath: string;
  videoPaths: string[];
  outputPattern: string; // e.g., "[name]_subbed" or "[name]_[subtitle]"
}

const [mode, setMode] = useState<DialogMode>("single");
const [batchState, setBatchState] = useState<BatchModeState>({
  subtitlePath: "",
  videoPaths: [],
  outputPattern: "[name]_subbed",
});
```

#### 2. Add Multi-File Selection IPC

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts`

```typescript
SELECT_VIDEO_FILES_MULTI: "ffmpeg:select-video-files-multi",
```

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts`

```typescript
ipcMain.handle(FFMPEG_CHANNELS.SELECT_VIDEO_FILES_MULTI, async () => {
  const result = await dialog.showOpenDialog({
    title: t("dialogs.selectVideoFiles"),
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Video Files",
        extensions: ["mp4", "mkv", "avi", "mov", "webm", "m4v"],
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths;
});
```

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-context.ts`

```typescript
selectVideoFilesMulti: (): Promise<string[] | null> =>
  ipcRenderer.invoke(FFMPEG_CHANNELS.SELECT_VIDEO_FILES_MULTI),
```

#### 3. Output Pattern System

**File:** `src/lib/output-pattern.ts`

```typescript
export interface PatternVariables {
  name: string; // Video filename without extension
  ext: string; // Original extension
  subtitle: string; // Subtitle filename without extension
  index: number; // 1-based index in batch
  date: string; // YYYY-MM-DD
}

export const OUTPUT_PATTERNS = {
  default: "[name]_subbed",
  withSubName: "[name]_[subtitle]",
  indexed: "[name]_[index]",
  dated: "[name]_[date]",
} as const;

export function applyOutputPattern(
  pattern: string,
  videoPath: string,
  subtitlePath: string,
  index: number,
): string {
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const subtitleName = path.basename(subtitlePath, path.extname(subtitlePath));
  const date = new Date().toISOString().split("T")[0];

  let result = pattern
    .replace(/\[name\]/g, videoName)
    .replace(/\[subtitle\]/g, subtitleName)
    .replace(/\[index\]/g, String(index))
    .replace(/\[date\]/g, date);

  // Sanitize filename (remove invalid characters)
  result = result.replace(/[<>:"/\\|?*]/g, "_");

  return result + ".mp4";
}

export function generateBatchOutputPaths(
  videoPaths: string[],
  subtitlePath: string,
  pattern: string,
  outputDir: string,
): { videoPath: string; outputPath: string }[] {
  return videoPaths.map((videoPath, index) => {
    const outputName = applyOutputPattern(
      pattern,
      videoPath,
      subtitlePath,
      index + 1,
    );
    const outputPath = path.join(outputDir, outputName);

    return { videoPath, outputPath };
  });
}
```

#### 4. Batch Mode UI Component

**File:** `src/components/wypalarka/WypalarkaBatchModePanel.tsx`

```typescript
interface BatchModePanelProps {
  subtitlePath: string;
  videoPaths: string[];
  outputPattern: string;
  outputDir: string;
  onSubtitleSelect: () => void;
  onVideosSelect: () => void;
  onPatternChange: (pattern: string) => void;
  onRemoveVideo: (index: number) => void;
}

export function WypalarkaBatchModePanel({
  subtitlePath,
  videoPaths,
  outputPattern,
  outputDir,
  onSubtitleSelect,
  onVideosSelect,
  onPatternChange,
  onRemoveVideo,
}: BatchModePanelProps) {
  const { t } = useTranslation();

  // Generate preview paths
  const previewPaths = useMemo(() => {
    if (!subtitlePath || videoPaths.length === 0) return [];
    return generateBatchOutputPaths(videoPaths, subtitlePath, outputPattern, outputDir);
  }, [videoPaths, subtitlePath, outputPattern, outputDir]);

  return (
    <div className="space-y-4">
      {/* Subtitle Selection */}
      <div className="space-y-2">
        <Label>{t("wypalarka.batch.subtitleFile")}</Label>
        <div className="flex gap-2">
          <Input
            value={subtitlePath ? path.basename(subtitlePath) : ""}
            placeholder={t("wypalarka.batch.selectSubtitle")}
            readOnly
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={onSubtitleSelect}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Files Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("wypalarka.batch.videoFiles", { count: videoPaths.length })}</Label>
          <Button variant="outline" size="sm" onClick={onVideosSelect}>
            <Plus className="h-4 w-4 mr-1" />
            {t("wypalarka.batch.addVideos")}
          </Button>
        </div>

        <ScrollArea className="h-32 border rounded-md p-2">
          {videoPaths.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              {t("wypalarka.batch.noVideosSelected")}
            </p>
          ) : (
            <div className="space-y-1">
              {videoPaths.map((videoPath, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{path.basename(videoPath)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveVideo(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Output Pattern */}
      <div className="space-y-2">
        <Label>{t("wypalarka.batch.outputPattern")}</Label>
        <Select value={outputPattern} onValueChange={onPatternChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="[name]_subbed">
              {t("wypalarka.batch.patterns.default")} ([name]_subbed.mp4)
            </SelectItem>
            <SelectItem value="[name]_[subtitle]">
              {t("wypalarka.batch.patterns.withSubName")} ([name]_[subtitle].mp4)
            </SelectItem>
            <SelectItem value="[name]_burned">
              {t("wypalarka.batch.patterns.burned")} ([name]_burned.mp4)
            </SelectItem>
            <SelectItem value="[name]">
              {t("wypalarka.batch.patterns.replace")} ([name].mp4)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("wypalarka.batch.patternHelp")}
        </p>
      </div>

      {/* Preview */}
      {previewPaths.length > 0 && (
        <div className="space-y-2">
          <Label>{t("wypalarka.batch.preview")}</Label>
          <ScrollArea className="h-40 border rounded-md p-2 bg-muted/30">
            <div className="space-y-2">
              {previewPaths.map(({ videoPath, outputPath }, index) => (
                <div key={index} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Film className="h-3 w-3" />
                    <span className="truncate">{path.basename(videoPath)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground pl-4">
                    <ArrowRight className="h-3 w-3" />
                    <span className="truncate">{path.basename(outputPath)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
```

#### 5. Integrate into Add Files Dialog

**File:** `src/components/wypalarka/WypalarkaAddFilesDialog.tsx`

```typescript
export function WypalarkaAddFilesDialog({ open, onOpenChange, onAddItems }: Props) {
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single mode state (existing)
  const [pairs, setPairs] = useState<FilePair[]>([createEmptyPair()]);

  // Batch mode state
  const [batchSubtitle, setBatchSubtitle] = useState("");
  const [batchVideos, setBatchVideos] = useState<string[]>([]);
  const [batchPattern, setBatchPattern] = useState("[name]_subbed");

  const handleBatchVideosSelect = async () => {
    const paths = await window.ffmpegAPI.selectVideoFilesMulti();
    if (paths) {
      setBatchVideos(prev => [...prev, ...paths]);
    }
  };

  const handleAddToQueue = () => {
    if (mode === "single") {
      // Existing single mode logic
      const validPairs = pairs.filter(p => p.videoPath && p.subtitlePath);
      onAddItems(validPairs.map(p => ({
        videoPath: p.videoPath,
        subtitlePath: p.subtitlePath,
        outputPath: p.outputPath,
      })));
    } else {
      // Batch mode: generate all pairs
      const items = batchVideos.map((videoPath, index) => {
        const outputName = applyOutputPattern(batchPattern, videoPath, batchSubtitle, index + 1);
        const outputPath = path.join(path.dirname(videoPath), outputName);

        return {
          videoPath,
          subtitlePath: batchSubtitle,
          outputPath,
        };
      });

      onAddItems(items);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("wypalarka.addFiles.title")}</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "batch")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">
              <FileVideo className="h-4 w-4 mr-2" />
              {t("wypalarka.addFiles.singleMode")}
            </TabsTrigger>
            <TabsTrigger value="batch">
              <Files className="h-4 w-4 mr-2" />
              {t("wypalarka.addFiles.batchMode")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            {/* Existing single pair UI */}
          </TabsContent>

          <TabsContent value="batch">
            <WypalarkaBatchModePanel
              subtitlePath={batchSubtitle}
              videoPaths={batchVideos}
              outputPattern={batchPattern}
              outputDir={outputSettings.customFolder || ""}
              onSubtitleSelect={handleBatchSubtitleSelect}
              onVideosSelect={handleBatchVideosSelect}
              onPatternChange={setBatchPattern}
              onRemoveVideo={(i) => setBatchVideos(prev => prev.filter((_, idx) => idx !== i))}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAddToQueue}
            disabled={mode === "batch" ? (!batchSubtitle || batchVideos.length === 0) : false}
          >
            {mode === "batch"
              ? t("wypalarka.addFiles.addCount", { count: batchVideos.length })
              : t("wypalarka.addFiles.add")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Translations

**File:** `src/localization/i18n.ts`

```typescript
// Polish
wypalarka: {
  addFiles: {
    singleMode: "Pojedyncze pary",
    batchMode: "Tryb wsadowy",
    addCount: "Dodaj {{count}} do kolejki",
  },
  batch: {
    subtitleFile: "Plik napisów",
    selectSubtitle: "Wybierz plik napisów...",
    videoFiles: "Pliki wideo ({{count}})",
    addVideos: "Dodaj wideo",
    noVideosSelected: "Nie wybrano żadnych plików wideo",
    outputPattern: "Wzorzec nazwy wyjściowej",
    patternHelp: "[name] = nazwa wideo, [subtitle] = nazwa napisów, [index] = numer",
    preview: "Podgląd",
    patterns: {
      default: "Domyślny",
      withSubName: "Z nazwą napisów",
      burned: "Z przyrostkiem _burned",
      replace: "Zastąp oryginał",
    },
  },
},

// English
wypalarka: {
  addFiles: {
    singleMode: "Single pairs",
    batchMode: "Batch mode",
    addCount: "Add {{count}} to queue",
  },
  batch: {
    subtitleFile: "Subtitle file",
    selectSubtitle: "Select subtitle file...",
    videoFiles: "Video files ({{count}})",
    addVideos: "Add videos",
    noVideosSelected: "No video files selected",
    outputPattern: "Output name pattern",
    patternHelp: "[name] = video name, [subtitle] = subtitle name, [index] = number",
    preview: "Preview",
    patterns: {
      default: "Default",
      withSubName: "With subtitle name",
      burned: "With _burned suffix",
      replace: "Replace original",
    },
  },
},
```

## Inverse Use Case: Multiple Subtitles to One Video

Consider adding reverse batch mode for applying multiple subtitle files to the same video:

```typescript
type BatchDirection = "one-sub-many-videos" | "many-subs-one-video";
```

This would be useful for:

- Creating multiple language versions
- Testing different subtitle timings
- Comparing subtitle sources

### Implementation (Future Enhancement)

```typescript
// State for reverse batch
const [reverseVideoPath, setReverseVideoPath] = useState("");
const [reverseSubtitlePaths, setReverseSubtitlePaths] = useState<string[]>([]);

// Output would include subtitle identifier
// video.mkv + english.ass → video_english.mp4
// video.mkv + spanish.ass → video_spanish.mp4
```

## Testing Checklist

- [ ] Select 1 subtitle + 5 videos, verify 5 queue items created
- [ ] Pattern `[name]_subbed` generates correct filenames
- [ ] Pattern `[name]_[subtitle]` includes subtitle filename
- [ ] Remove video from selection works
- [ ] Preview updates as selections change
- [ ] Output respects output settings (same dir, subfolder, custom)
- [ ] Handles videos from different directories
- [ ] Handles special characters in filenames
- [ ] Cancel clears state
- [ ] Switch between single/batch mode preserves separate state

## Files to Modify

1. `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts` - Add multi-select channel
2. `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts` - Add multi-select handler
3. `src/helpers/ipc/ffmpeg/ffmpeg-context.ts` - Expose multi-select
4. `src/lib/output-pattern.ts` - New file for pattern logic
5. `src/components/wypalarka/WypalarkaBatchModePanel.tsx` - New component
6. `src/components/wypalarka/WypalarkaAddFilesDialog.tsx` - Add batch mode
7. `src/localization/i18n.ts` - Add translations
8. `src/types.d.ts` - Update FFmpegAPI interface
