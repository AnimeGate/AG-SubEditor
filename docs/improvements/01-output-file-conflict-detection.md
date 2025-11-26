# Output File Conflict Detection

## Overview

Add a confirmation dialog when the output file already exists to prevent accidental data loss. Currently, FFmpeg silently overwrites existing files with the `-y` flag.

## Current Behavior

**Location:** `src/lib/ffmpeg-processor.ts:438`

```typescript
args.push("-y"); // Always overwrite without asking
```

**Problem:** Users can accidentally overwrite important files with no warning.

## Proposed Solution

### User Flow

1. User selects output path (or uses auto-generated path)
2. Before encoding starts, check if output file exists
3. If exists, show dialog with options:
   - **Overwrite** - Replace existing file
   - **Auto-rename** - Append suffix (e.g., `video_burned_1.mp4`)
   - **Choose new path** - Open save dialog
   - **Cancel** - Abort operation

### Implementation Steps

#### 1. Add IPC Channel for File Existence Check

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts`

```typescript
CHECK_OUTPUT_EXISTS: "ffmpeg:check-output-exists",
RESOLVE_OUTPUT_CONFLICT: "ffmpeg:resolve-output-conflict",
```

#### 2. Add Main Process Listener

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts`

```typescript
ipcMain.handle(FFMPEG_CHANNELS.CHECK_OUTPUT_EXISTS, async (_, outputPath: string) => {
  return fs.existsSync(outputPath);
});

ipcMain.handle(FFMPEG_CHANNELS.RESOLVE_OUTPUT_CONFLICT, async (_, outputPath: string) => {
  // Generate unique filename: video.mp4 -> video_1.mp4, video_2.mp4, etc.
  const dir = path.dirname(outputPath);
  const ext = path.extname(outputPath);
  const base = path.basename(outputPath, ext);

  let counter = 1;
  let newPath = outputPath;
  while (fs.existsSync(newPath)) {
    newPath = path.join(dir, `${base}_${counter}${ext}`);
    counter++;
  }
  return newPath;
});
```

#### 3. Add Context Exposure

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-context.ts`

```typescript
checkOutputExists: (outputPath: string): Promise<boolean> =>
  ipcRenderer.invoke(FFMPEG_CHANNELS.CHECK_OUTPUT_EXISTS, outputPath),

resolveOutputConflict: (outputPath: string): Promise<string> =>
  ipcRenderer.invoke(FFMPEG_CHANNELS.RESOLVE_OUTPUT_CONFLICT, outputPath),
```

#### 4. Create Conflict Dialog Component

**File:** `src/components/wypalarka/WypalarkaOutputConflictDialog.tsx`

```typescript
interface OutputConflictDialogProps {
  open: boolean;
  outputPath: string;
  onOverwrite: () => void;
  onAutoRename: (newPath: string) => void;
  onChooseNew: () => void;
  onCancel: () => void;
}

export function WypalarkaOutputConflictDialog({ ... }: OutputConflictDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("wypalarka.conflict.title")}</DialogTitle>
          <DialogDescription>
            {t("wypalarka.conflict.description", { path: outputPath })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button variant="destructive" onClick={onOverwrite}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t("wypalarka.conflict.overwrite")}
          </Button>

          <Button variant="secondary" onClick={() => handleAutoRename()}>
            <FileEdit className="mr-2 h-4 w-4" />
            {t("wypalarka.conflict.autoRename")}
          </Button>

          <Button variant="secondary" onClick={onChooseNew}>
            <FolderOpen className="mr-2 h-4 w-4" />
            {t("wypalarka.conflict.chooseNew")}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 5. Integrate into Single File Mode

**File:** `src/components/wypalarka/Wypalarka.tsx`

Modify `handleStartProcess()`:

```typescript
const handleStartProcess = async () => {
  // Check if output exists
  const exists = await window.ffmpegAPI.checkOutputExists(outputPath);

  if (exists) {
    setConflictDialogOpen(true);
    return; // Wait for user decision
  }

  // Proceed with encoding
  startEncoding();
};

const handleConflictResolution = async (action: "overwrite" | "autoRename" | "chooseNew") => {
  setConflictDialogOpen(false);

  switch (action) {
    case "overwrite":
      startEncoding(); // Use original path
      break;
    case "autoRename":
      const newPath = await window.ffmpegAPI.resolveOutputConflict(outputPath);
      setOutputPath(newPath);
      startEncoding();
      break;
    case "chooseNew":
      // Open save dialog, then startEncoding with new path
      break;
  }
};
```

#### 6. Integrate into Queue Mode

**File:** `src/lib/queue-processor.ts`

Add pre-flight check before processing each item:

```typescript
private async checkOutputConflict(item: QueueItem): Promise<boolean> {
  if (fs.existsSync(item.outputPath)) {
    // Emit event for UI to handle
    this.callbacks.onItemConflict?.(item.id, item.outputPath);
    return true;
  }
  return false;
}
```

**Queue Options:**
- Check all items before starting (recommended)
- Auto-rename all conflicts
- Skip conflicting items
- Ask for each (interrupts queue)

### Translations

**File:** `src/localization/i18n.ts`

```typescript
// Polish
wypalarka: {
  conflict: {
    title: "Plik już istnieje",
    description: "Plik wyjściowy \"{{path}}\" już istnieje. Co chcesz zrobić?",
    overwrite: "Nadpisz istniejący plik",
    autoRename: "Użyj nowej nazwy automatycznie",
    chooseNew: "Wybierz inną lokalizację",
  }
}

// English
wypalarka: {
  conflict: {
    title: "File already exists",
    description: "Output file \"{{path}}\" already exists. What do you want to do?",
    overwrite: "Overwrite existing file",
    autoRename: "Use auto-generated name",
    chooseNew: "Choose different location",
  }
}
```

## Queue-Specific Considerations

For queue mode, add a setting in `WypalarkaSettingsModal.tsx`:

```typescript
interface OutputSettings {
  // ... existing
  conflictResolution: "ask" | "overwrite" | "autoRename" | "skip";
}
```

- **ask** - Pause queue and ask user (default for single items)
- **overwrite** - Always overwrite (current behavior)
- **autoRename** - Auto-generate unique names
- **skip** - Skip items with conflicts, mark as error

## Testing Checklist

- [ ] Single file: output exists, user chooses overwrite
- [ ] Single file: output exists, user chooses auto-rename
- [ ] Single file: output exists, user chooses new path
- [ ] Single file: output exists, user cancels
- [ ] Queue: pre-flight detects multiple conflicts
- [ ] Queue: auto-rename mode generates unique names
- [ ] Queue: skip mode marks items as skipped
- [ ] Edge case: auto-rename when `video_1.mp4` through `video_99.mp4` exist

## Files to Modify

1. `src/helpers/ipc/ffmpeg/ffmpeg-channels.ts` - Add channels
2. `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts` - Add handlers
3. `src/helpers/ipc/ffmpeg/ffmpeg-context.ts` - Expose to renderer
4. `src/components/wypalarka/WypalarkaOutputConflictDialog.tsx` - New component
5. `src/components/wypalarka/Wypalarka.tsx` - Integrate dialog
6. `src/components/wypalarka/WypalarkaSettingsModal.tsx` - Add queue setting
7. `src/lib/queue-processor.ts` - Add pre-flight check
8. `src/localization/i18n.ts` - Add translations
9. `src/types.d.ts` - Update OutputSettings type
