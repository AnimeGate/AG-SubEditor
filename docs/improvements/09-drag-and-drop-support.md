# Drag and Drop File Support

## Overview

Add drag-and-drop functionality for file selection in the Wypalarka feature. Currently, users can only select files through native file dialogs, which requires multiple clicks.

## Current Behavior

**Locations:**
- `src/components/wypalarka/WypalarkaFileInput.tsx` - Single file mode inputs
- `src/components/wypalarka/WypalarkaAddFilesDialog.tsx` - Queue add dialog

Users must click a button → open native dialog → navigate to file → select → confirm.

**Problem:** Tedious workflow, especially when files are already visible in a file manager.

## Proposed Solution

### Drop Zones

1. **Single File Mode:**
   - Video input: Drop video files
   - Subtitle input: Drop .ass/.srt files
   - Output input: Drop folder or file path

2. **Queue Panel:**
   - Drop video+subtitle pairs (auto-pair by name)
   - Drop multiple videos (prompt for subtitle)

3. **Batch Mode:**
   - Drop multiple videos to video list
   - Drop single subtitle file

### Implementation Steps

#### 1. Create Reusable DropZone Component

**File:** `src/components/ui/drop-zone.tsx`

```typescript
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[]; // File extensions: [".mp4", ".mkv", ".ass"]
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  activeClassName?: string;
}

export function DropZone({
  onDrop,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
  activeClassName = "border-primary bg-primary/5",
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Check if files are being dragged (not text, etc.)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = "copy";
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set false if leaving the drop zone entirely
    // (not entering a child element)
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);

    // Filter by accepted extensions if specified
    let filteredFiles = files;
    if (accept && accept.length > 0) {
      filteredFiles = files.filter(file => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        return accept.includes(ext);
      });
    }

    // Respect multiple flag
    if (!multiple && filteredFiles.length > 1) {
      filteredFiles = [filteredFiles[0]];
    }

    if (filteredFiles.length > 0) {
      onDrop(filteredFiles);
    }
  }, [onDrop, accept, multiple, disabled]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "transition-colors duration-200",
        isDragOver && activeClassName,
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </div>
  );
}
```

#### 2. Create File Path Resolution Helper

Since dropped files are `File` objects with `path` property (Electron), we need to extract paths:

**File:** `src/lib/drop-helpers.ts`

```typescript
/**
 * Extract file paths from dropped File objects.
 * In Electron, File objects have a `path` property with the full filesystem path.
 */
export function getDroppedFilePaths(files: File[]): string[] {
  return files.map(file => (file as File & { path: string }).path).filter(Boolean);
}

/**
 * Categorize dropped files by type.
 */
export function categorizeDroppedFiles(files: File[]): {
  videos: string[];
  subtitles: string[];
  other: string[];
} {
  const videoExtensions = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".wmv", ".flv"];
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
  subtitles: string[]
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
```

#### 3. Update Single File Input with Drop Zone

**File:** `src/components/wypalarka/WypalarkaFileInput.tsx`

```typescript
import { DropZone } from "@/components/ui/drop-zone";
import { getDroppedFilePaths } from "@/lib/drop-helpers";

export function WypalarkaFileInput({
  videoPath,
  subtitlePath,
  outputPath,
  onVideoSelect,
  onSubtitleSelect,
  onOutputSelect,
  disabled,
}: Props) {
  const { t } = useTranslation();

  const handleVideoDrop = (files: File[]) => {
    const paths = getDroppedFilePaths(files);
    if (paths.length > 0) {
      onVideoSelect(paths[0]);
    }
  };

  const handleSubtitleDrop = (files: File[]) => {
    const paths = getDroppedFilePaths(files);
    if (paths.length > 0) {
      onSubtitleSelect(paths[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Input with Drop Zone */}
      <div className="space-y-2">
        <Label>{t("wypalarka.videoFile")}</Label>
        <DropZone
          onDrop={handleVideoDrop}
          accept={[".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"]}
          disabled={disabled}
          className="rounded-md border-2 border-dashed border-transparent"
          activeClassName="border-primary bg-primary/5"
        >
          <div className="flex gap-2">
            <Input
              value={videoPath ? path.basename(videoPath) : ""}
              placeholder={t("wypalarka.dropOrSelectVideo")}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleVideoDialogOpen}
              disabled={disabled}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          {/* Drop hint shown when empty */}
          {!videoPath && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {t("wypalarka.dropHint")}
            </p>
          )}
        </DropZone>
      </div>

      {/* Subtitle Input with Drop Zone */}
      <div className="space-y-2">
        <Label>{t("wypalarka.subtitleFile")}</Label>
        <DropZone
          onDrop={handleSubtitleDrop}
          accept={[".ass", ".srt", ".ssa"]}
          disabled={disabled}
          className="rounded-md border-2 border-dashed border-transparent"
          activeClassName="border-primary bg-primary/5"
        >
          <div className="flex gap-2">
            <Input
              value={subtitlePath ? path.basename(subtitlePath) : ""}
              placeholder={t("wypalarka.dropOrSelectSubtitle")}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSubtitleDialogOpen}
              disabled={disabled}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </DropZone>
      </div>

      {/* Output path - no drop zone (uses save dialog) */}
      {/* ... existing output input ... */}
    </div>
  );
}
```

#### 4. Add Drop Zone to Queue Panel

**File:** `src/components/wypalarka/WypalarkaQueuePanel.tsx`

```typescript
import { DropZone } from "@/components/ui/drop-zone";
import { categorizeDroppedFiles, autoPairFiles, getDroppedFilePaths } from "@/lib/drop-helpers";

export function WypalarkaQueuePanel({ queue, onAddItems, ... }: Props) {
  const { t } = useTranslation();
  const [showUnpairedDialog, setShowUnpairedDialog] = useState(false);
  const [unpairedVideos, setUnpairedVideos] = useState<string[]>([]);

  const handleQueueDrop = async (files: File[]) => {
    const { videos, subtitles } = categorizeDroppedFiles(files);

    if (videos.length === 0) {
      // Only subtitles dropped - show error or ignore
      return;
    }

    if (subtitles.length === 0) {
      // Only videos - prompt user to select subtitle
      setUnpairedVideos(videos);
      setShowUnpairedDialog(true);
      return;
    }

    // Try to auto-pair
    const { paired, unpaired } = autoPairFiles(videos, subtitles);

    // Add paired items to queue
    if (paired.length > 0) {
      const items = paired.map(({ video, subtitle }) => ({
        videoPath: video,
        subtitlePath: subtitle,
        outputPath: generateOutputPath(video), // Use output settings
      }));
      onAddItems(items);
    }

    // Handle unpaired videos
    if (unpaired.length > 0) {
      setUnpairedVideos(unpaired);
      setShowUnpairedDialog(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{t("wypalarka.queue.title")}</h3>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t("wypalarka.queue.addFiles")}
        </Button>
      </div>

      {/* Queue list with drop zone */}
      <DropZone
        onDrop={handleQueueDrop}
        accept={[".mp4", ".mkv", ".avi", ".mov", ".ass", ".srt"]}
        multiple
        className="flex-1 rounded-lg border-2 border-dashed border-muted"
        activeClassName="border-primary bg-primary/5"
      >
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <Upload className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {t("wypalarka.queue.dropFilesHere")}
            </p>
            <p className="text-xs text-center mt-2">
              {t("wypalarka.queue.dropHint")}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            {/* Existing queue items */}
          </ScrollArea>
        )}
      </DropZone>

      {/* Unpaired videos dialog */}
      <UnpairedVideosDialog
        open={showUnpairedDialog}
        videos={unpairedVideos}
        onSelectSubtitle={handleSelectSubtitleForUnpaired}
        onCancel={() => setShowUnpairedDialog(false)}
      />
    </div>
  );
}
```

#### 5. Unpaired Videos Dialog

**File:** `src/components/wypalarka/WypalarkaUnpairedDialog.tsx`

```typescript
interface UnpairedVideosDialogProps {
  open: boolean;
  videos: string[];
  onSelectSubtitle: (subtitle: string) => void;
  onCancel: () => void;
}

export function UnpairedVideosDialog({
  open,
  videos,
  onSelectSubtitle,
  onCancel,
}: UnpairedVideosDialogProps) {
  const { t } = useTranslation();

  const handleSelectSubtitle = async () => {
    const result = await window.ffmpegAPI.selectSubtitleFile();
    if (result) {
      onSelectSubtitle(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("wypalarka.unpaired.title")}</DialogTitle>
          <DialogDescription>
            {t("wypalarka.unpaired.description", { count: videos.length })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-40">
          <ul className="space-y-1 text-sm">
            {videos.map((video, i) => (
              <li key={i} className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                {path.basename(video)}
              </li>
            ))}
          </ul>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSelectSubtitle}>
            <FileText className="h-4 w-4 mr-2" />
            {t("wypalarka.unpaired.selectSubtitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 6. Visual Feedback Styling

**File:** `src/styles/global.css`

```css
/* Drop zone animations */
.drop-zone-active {
  animation: drop-pulse 1s ease-in-out infinite;
}

@keyframes drop-pulse {
  0%, 100% {
    border-color: hsl(var(--primary) / 0.5);
    background-color: hsl(var(--primary) / 0.02);
  }
  50% {
    border-color: hsl(var(--primary));
    background-color: hsl(var(--primary) / 0.08);
  }
}
```

### Translations

**File:** `src/localization/i18n.ts`

```typescript
// Polish
wypalarka: {
  dropOrSelectVideo: "Upuść plik wideo lub kliknij aby wybrać...",
  dropOrSelectSubtitle: "Upuść plik napisów lub kliknij aby wybrać...",
  dropHint: "Przeciągnij i upuść plik tutaj",
  queue: {
    dropFilesHere: "Upuść pliki tutaj",
    dropHint: "Przeciągnij pliki wideo i napisy - zostaną automatycznie sparowane",
  },
  unpaired: {
    title: "Brak pasujących napisów",
    description: "Nie znaleziono napisów dla {{count}} plików wideo. Wybierz plik napisów do zastosowania dla wszystkich.",
    selectSubtitle: "Wybierz napisy",
  },
},

// English
wypalarka: {
  dropOrSelectVideo: "Drop video file or click to select...",
  dropOrSelectSubtitle: "Drop subtitle file or click to select...",
  dropHint: "Drag and drop file here",
  queue: {
    dropFilesHere: "Drop files here",
    dropHint: "Drag video and subtitle files - they will be auto-paired",
  },
  unpaired: {
    title: "No matching subtitles",
    description: "No subtitles found for {{count}} video files. Select a subtitle file to apply to all.",
    selectSubtitle: "Select subtitle",
  },
},
```

## Security Considerations

1. **File Type Validation**: Always validate dropped file extensions
2. **Path Validation**: Use existing path validation from improvement #4
3. **No Auto-Execute**: Dropped files should only set paths, not auto-start encoding

## Testing Checklist

- [ ] Drop single video file on video input
- [ ] Drop single subtitle file on subtitle input
- [ ] Drop wrong file type (shows no visual feedback, ignores)
- [ ] Drop multiple files on single-file input (uses first)
- [ ] Drop video+subtitle pair on queue (auto-pairs)
- [ ] Drop multiple videos without subtitles (shows dialog)
- [ ] Drop files while disabled (ignores)
- [ ] Visual feedback during drag hover
- [ ] Auto-pairing by exact name match
- [ ] Auto-pairing by partial name match
- [ ] Keyboard accessibility (drag/drop not required)

## Files to Create/Modify

1. `src/components/ui/drop-zone.tsx` - New reusable component
2. `src/lib/drop-helpers.ts` - New file for drop utilities
3. `src/components/wypalarka/WypalarkaFileInput.tsx` - Add drop zones
4. `src/components/wypalarka/WypalarkaQueuePanel.tsx` - Add queue drop zone
5. `src/components/wypalarka/WypalarkaUnpairedDialog.tsx` - New component
6. `src/components/wypalarka/WypalarkaBatchModePanel.tsx` - Add drop zone
7. `src/styles/global.css` - Drop zone animations
8. `src/localization/i18n.ts` - Add translations
