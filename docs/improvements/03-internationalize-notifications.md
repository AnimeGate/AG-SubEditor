# Internationalize Notification Messages

## Overview

Replace hardcoded Polish strings in desktop notifications and other system messages with internationalized strings using i18next. Currently, some messages are only in Polish regardless of user's language setting.

## Current Behavior

**Location:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts:185-200`

```typescript
const notification = new Notification({
  title: "Wypalanie zakończone!", // Hardcoded Polish
  body: `Plik ${fileName} został pomyślnie przetworzony.`,
});
```

**Location:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts:337-348`

```typescript
const notification = new Notification({
  title: "Kolejka zakończona!", // Hardcoded Polish
  body: `Przetworzono ${completedCount} plików.`,
});
```

**Problem:** Non-Polish users see Polish notifications.

## Proposed Solution

### Architecture Decision

Since notifications are shown from the main process (not renderer), we need to either:

1. **Option A:** Initialize i18next in main process
2. **Option B:** Pass translated strings via IPC from renderer
3. **Option C:** Store current language in settings, translate in main process

**Recommended: Option C** - Most maintainable, keeps translations centralized.

### Implementation Steps

#### 1. Create Main Process Translation Helper

**File:** `src/helpers/main-translations.ts`

```typescript
import { settingsStore } from "./settings/settings-store";

// Notification translations - keep minimal for main process
const translations = {
  pl: {
    notifications: {
      encodingComplete: {
        title: "Wypalanie zakończone!",
        body: "Plik {{fileName}} został pomyślnie przetworzony.",
      },
      queueComplete: {
        title: "Kolejka zakończona!",
        body: "Przetworzono {{count}} plik.",
        body_plural: "Przetworzono {{count}} pliki.",
        body_many: "Przetworzono {{count}} plików.",
      },
      encodingError: {
        title: "Błąd wypalania",
        body: "Wystąpił błąd podczas przetwarzania {{fileName}}.",
      },
      queueError: {
        title: "Błąd kolejki",
        body: "{{errorCount}} z {{totalCount}} plików nie udało się przetworzyć.",
      },
    },
  },
  en: {
    notifications: {
      encodingComplete: {
        title: "Encoding complete!",
        body: "File {{fileName}} has been successfully processed.",
      },
      queueComplete: {
        title: "Queue complete!",
        body: "Processed {{count}} file.",
        body_plural: "Processed {{count}} files.",
      },
      encodingError: {
        title: "Encoding error",
        body: "An error occurred while processing {{fileName}}.",
      },
      queueError: {
        title: "Queue error",
        body: "{{errorCount}} of {{totalCount}} files failed to process.",
      },
    },
  },
};

type TranslationKey =
  | "notifications.encodingComplete.title"
  | "notifications.encodingComplete.body"
  | "notifications.queueComplete.title"
  | "notifications.queueComplete.body"
  | "notifications.encodingError.title"
  | "notifications.encodingError.body"
  | "notifications.queueError.title"
  | "notifications.queueError.body";

interface TranslateOptions {
  count?: number;
  [key: string]: string | number | undefined;
}

export function t(key: TranslationKey, options?: TranslateOptions): string {
  const language = settingsStore.get("language") || "pl";
  const lang =
    translations[language as keyof typeof translations] || translations.en;

  // Navigate to the key
  const keys = key.split(".");
  let value: unknown = lang;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  // Handle pluralization for Polish
  if (options?.count !== undefined && typeof value === "object") {
    const count = options.count;
    const pluralValue = value as {
      body: string;
      body_plural?: string;
      body_many?: string;
    };

    if (language === "pl") {
      // Polish pluralization rules
      if (count === 1) {
        value = pluralValue.body;
      } else if (
        count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 10 || count % 100 >= 20)
      ) {
        value = pluralValue.body_plural || pluralValue.body;
      } else {
        value =
          pluralValue.body_many || pluralValue.body_plural || pluralValue.body;
      }
    } else {
      // English pluralization
      value =
        count === 1
          ? pluralValue.body
          : pluralValue.body_plural || pluralValue.body;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // Replace interpolation placeholders
  let result = value;
  if (options) {
    for (const [optKey, optValue] of Object.entries(options)) {
      result = result.replace(
        new RegExp(`{{${optKey}}}`, "g"),
        String(optValue),
      );
    }
  }

  return result;
}
```

#### 2. Update Notification Code

**File:** `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts`

```typescript
import { t } from "../main-translations";

// Single file completion (around line 185)
const notification = new Notification({
  title: t("notifications.encodingComplete.title"),
  body: t("notifications.encodingComplete.body", { fileName }),
});

// Queue completion (around line 337)
const notification = new Notification({
  title: t("notifications.queueComplete.title"),
  body: t("notifications.queueComplete.body", { count: completedCount }),
});

// Error notification (if adding)
const errorNotification = new Notification({
  title: t("notifications.encodingError.title"),
  body: t("notifications.encodingError.body", { fileName }),
});
```

#### 3. Add Missing Translations to Renderer i18n

**File:** `src/localization/i18n.ts`

Ensure renderer translations match for consistency:

```typescript
// Polish
notifications: {
  encodingComplete: {
    title: "Wypalanie zakończone!",
    body: "Plik {{fileName}} został pomyślnie przetworzony.",
  },
  queueComplete: {
    title: "Kolejka zakończona!",
    body_one: "Przetworzono {{count}} plik.",
    body_few: "Przetworzono {{count}} pliki.",
    body_many: "Przetworzono {{count}} plików.",
  },
  // ...
},

// English
notifications: {
  encodingComplete: {
    title: "Encoding complete!",
    body: "File {{fileName}} has been successfully processed.",
  },
  queueComplete: {
    title: "Queue complete!",
    body_one: "Processed {{count}} file.",
    body_other: "Processed {{count}} files.",
  },
  // ...
},
```

#### 4. Sync Language Setting to Main Process

Ensure language changes in renderer are immediately available to main process.

**File:** `src/helpers/ipc/settings/settings-listeners.ts`

The existing `UPDATE_LANGUAGE` handler already saves to settings store, which main process can read.

#### 5. Additional Hardcoded Strings to Fix

Search for other hardcoded Polish strings:

**File:** `src/lib/ffmpeg-processor.ts`

```typescript
// Line ~500 - error messages
throw new Error("FFmpeg process failed"); // OK - technical error
```

**File:** `src/lib/ffmpeg-downloader.ts`

```typescript
// Check for any user-facing messages
```

**File:** `src/helpers/ipc/file/file-listeners.ts`

```typescript
// Dialog titles
title: "Wybierz plik wideo",  // Should be translated
title: "Wybierz plik napisów", // Should be translated
```

### Dialog Title Translations

For file dialogs, pass translated strings from renderer:

**Option 1:** Pass title via IPC

```typescript
// Renderer
const result = await window.ffmpegAPI.selectVideoFile({
  title: t("wypalarka.selectVideo"),
});

// Main process listener
ipcMain.handle(
  FFMPEG_CHANNELS.SELECT_VIDEO_FILE,
  async (_, options?: { title?: string }) => {
    const result = await dialog.showOpenDialog({
      title: options?.title || "Select video file",
      // ...
    });
  },
);
```

**Option 2:** Use main process translations

```typescript
// Main process
import { t } from "../main-translations";

ipcMain.handle(FFMPEG_CHANNELS.SELECT_VIDEO_FILE, async () => {
  const result = await dialog.showOpenDialog({
    title: t("dialogs.selectVideo"),
    // ...
  });
});
```

### Testing Checklist

- [ ] Change language to English, trigger single file completion notification
- [ ] Change language to Polish, trigger single file completion notification
- [ ] Queue completion notification shows correct language
- [ ] Plural forms work correctly (1 file, 2-4 files, 5+ files in Polish)
- [ ] File dialog titles show correct language
- [ ] Error notifications show correct language
- [ ] Language change takes effect immediately (no restart needed)

## Files to Modify

1. `src/helpers/main-translations.ts` - New file for main process translations
2. `src/helpers/ipc/ffmpeg/ffmpeg-listeners.ts` - Update notifications
3. `src/helpers/ipc/file/file-listeners.ts` - Update dialog titles
4. `src/localization/i18n.ts` - Add notification keys to renderer translations

## Translation Keys to Add

### Polish (pl)

```typescript
notifications: {
  encodingComplete: {
    title: "Wypalanie zakończone!",
    body: "Plik {{fileName}} został pomyślnie przetworzony.",
  },
  queueComplete: {
    title: "Kolejka zakończona!",
    body_one: "Przetworzono {{count}} plik.",
    body_few: "Przetworzono {{count}} pliki.",
    body_many: "Przetworzono {{count}} plików.",
  },
  encodingError: {
    title: "Błąd wypalania",
    body: "Wystąpił błąd podczas przetwarzania {{fileName}}.",
  },
},
dialogs: {
  selectVideo: "Wybierz plik wideo",
  selectSubtitle: "Wybierz plik napisów",
  selectOutput: "Wybierz lokalizację pliku wyjściowego",
},
```

### English (en)

```typescript
notifications: {
  encodingComplete: {
    title: "Encoding complete!",
    body: "File {{fileName}} has been successfully processed.",
  },
  queueComplete: {
    title: "Queue complete!",
    body_one: "Processed {{count}} file.",
    body_other: "Processed {{count}} files.",
  },
  encodingError: {
    title: "Encoding error",
    body: "An error occurred while processing {{fileName}}.",
  },
},
dialogs: {
  selectVideo: "Select video file",
  selectSubtitle: "Select subtitle file",
  selectOutput: "Select output file location",
},
```
