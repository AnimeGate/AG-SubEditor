# Persist Encoding Settings

## Overview

Save encoding settings (quality preset, bitrate, GPU options, etc.) to the settings store so they persist across app restarts. Currently, users must reconfigure encoding settings every session.

## Current Behavior

**Location:** `src/components/wypalarka/Wypalarka.tsx:26-42`

```typescript
const [encodingSettings, setEncodingSettings] = useState<EncodingSettings>({
  qualityPreset: "medium",
  useHardwareAcceleration: true,
  // ... defaults reset on every app start
});
```

**Problem:** Settings are only stored in React state, lost on page refresh or app restart.

## Proposed Solution

### Implementation Steps

#### 1. Extend Settings Store Schema

**File:** `src/helpers/settings/settings-store.ts`

Add encoding settings to the schema:

```typescript
interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  output: OutputSettings;
  encoding: EncodingSettings; // NEW
}

const defaultSettings: AppSettings = {
  theme: "system",
  language: "pl",
  output: {
    /* ... */
  },
  encoding: {
    qualityPreset: "medium",
    useHardwareAcceleration: true,
    hardwareEncoder: null,
    selectedProfile: null,
    rateControl: "vbr_hq",
    cqValue: 23,
    customBitrate: "6000k",
    nvencPreset: "p4",
    enableSpatialAq: true,
    enableTemporalAq: true,
    aqStrength: 15,
    lookahead: 20,
    bFrames: 2,
    targetResolution: null,
    maintainAspectRatio: true,
  },
};
```

#### 2. Add IPC Channels for Encoding Settings

**File:** `src/helpers/ipc/settings/settings-channels.ts`

```typescript
export const SETTINGS_CHANNELS = {
  // ... existing
  GET_ENCODING: "settings:get-encoding",
  UPDATE_ENCODING: "settings:update-encoding",
};
```

#### 3. Add Main Process Listeners

**File:** `src/helpers/ipc/settings/settings-listeners.ts`

```typescript
ipcMain.handle(SETTINGS_CHANNELS.GET_ENCODING, () => {
  return settingsStore.get("encoding");
});

ipcMain.handle(
  SETTINGS_CHANNELS.UPDATE_ENCODING,
  (_, settings: Partial<EncodingSettings>) => {
    const current = settingsStore.get("encoding");
    const updated = { ...current, ...settings };
    settingsStore.set("encoding", updated);
    return updated;
  },
);
```

#### 4. Add Context Exposure

**File:** `src/helpers/ipc/settings/settings-context.ts`

```typescript
contextBridge.exposeInMainWorld("settingsAPI", {
  // ... existing
  getEncoding: (): Promise<EncodingSettings> =>
    ipcRenderer.invoke(SETTINGS_CHANNELS.GET_ENCODING),

  updateEncoding: (
    settings: Partial<EncodingSettings>,
  ): Promise<EncodingSettings> =>
    ipcRenderer.invoke(SETTINGS_CHANNELS.UPDATE_ENCODING, settings),
});
```

#### 5. Update Type Definitions

**File:** `src/types.d.ts`

```typescript
interface SettingsAPI {
  // ... existing
  getEncoding: () => Promise<EncodingSettings>;
  updateEncoding: (
    settings: Partial<EncodingSettings>,
  ) => Promise<EncodingSettings>;
}
```

#### 6. Load Settings on Component Mount

**File:** `src/components/wypalarka/Wypalarka.tsx`

```typescript
const [encodingSettings, setEncodingSettings] =
  useState<EncodingSettings | null>(null);
const [isLoadingSettings, setIsLoadingSettings] = useState(true);

useEffect(() => {
  const loadSettings = async () => {
    try {
      const saved = await window.settingsAPI.getEncoding();
      setEncodingSettings(saved);
    } catch (error) {
      console.error("Failed to load encoding settings:", error);
      // Fall back to defaults
      setEncodingSettings(defaultEncodingSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  loadSettings();
}, []);
```

#### 7. Save Settings on Change

**File:** `src/components/wypalarka/WypalarkaSettingsModal.tsx`

```typescript
const handleSettingChange = async (
  key: keyof EncodingSettings,
  value: unknown,
) => {
  const updated = { ...settings, [key]: value };
  setSettings(updated);

  // Persist to store (debounced)
  debouncedSave(updated);
};

const debouncedSave = useMemo(
  () =>
    debounce(async (settings: EncodingSettings) => {
      try {
        await window.settingsAPI.updateEncoding(settings);
      } catch (error) {
        console.error("Failed to save encoding settings:", error);
      }
    }, 500),
  [],
);

// Cleanup on unmount
useEffect(() => {
  return () => {
    debouncedSave.cancel();
  };
}, [debouncedSave]);
```

#### 8. Handle Profile Selection Persistence

When user selects a profile, save both the profile name and its expanded settings:

```typescript
const handleProfileSelect = async (profileName: string) => {
  const profile = ENCODING_PROFILES[profileName];

  const updated: EncodingSettings = {
    ...settings,
    selectedProfile: profileName,
    // Apply profile values
    customBitrate: profile.bitrate,
    nvencPreset: profile.preset,
    rateControl: profile.rateControl,
    enableSpatialAq: profile.spatialAq,
    enableTemporalAq: profile.temporalAq,
    targetResolution: profile.resolution,
  };

  setSettings(updated);
  await window.settingsAPI.updateEncoding(updated);
};
```

### Migration Strategy

For existing users without encoding settings in their store:

**File:** `src/helpers/settings/settings-store.ts`

```typescript
private migrate(): void {
  const settings = this.loadSettings();

  // Add encoding defaults if missing
  if (!settings.encoding) {
    settings.encoding = defaultSettings.encoding;
    this.saveSettings(settings);
  }
}
```

### Loading State UI

Show skeleton/loading state while settings load:

**File:** `src/components/wypalarka/Wypalarka.tsx`

```typescript
if (isLoadingSettings) {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">{t("wypalarka.loadingSettings")}</span>
    </div>
  );
}
```

### Settings Reset Option

Add a "Reset to Defaults" button in settings modal:

```typescript
const handleResetDefaults = async () => {
  const defaults = defaultEncodingSettings;
  setSettings(defaults);
  await window.settingsAPI.updateEncoding(defaults);
};

// In JSX
<Button variant="outline" onClick={handleResetDefaults}>
  <RotateCcw className="mr-2 h-4 w-4" />
  {t("wypalarka.settings.resetDefaults")}
</Button>
```

## Data Flow

```
App Start
    │
    ▼
Wypalarka mounts
    │
    ▼
Load settings from store ──► settingsAPI.getEncoding()
    │                              │
    ▼                              ▼
Set React state ◄───────── settings-store.ts
    │
    ▼
User changes setting
    │
    ▼
Update React state
    │
    ▼
Debounced save ──────────► settingsAPI.updateEncoding()
                                   │
                                   ▼
                            settings-store.ts (persist to disk)
```

## Testing Checklist

- [ ] Fresh install: default settings loaded
- [ ] Change quality preset, restart app, verify persisted
- [ ] Change hardware acceleration, restart app, verify persisted
- [ ] Select profile, restart app, verify profile and expanded values persisted
- [ ] Reset to defaults works correctly
- [ ] Settings file corruption: graceful fallback to defaults
- [ ] Rapid setting changes: debounce prevents excessive writes
- [ ] Settings sync with queue processor on change

## Files to Modify

1. `src/helpers/settings/settings-store.ts` - Add encoding to schema
2. `src/helpers/ipc/settings/settings-channels.ts` - Add channels
3. `src/helpers/ipc/settings/settings-listeners.ts` - Add handlers
4. `src/helpers/ipc/settings/settings-context.ts` - Expose to renderer
5. `src/types.d.ts` - Update SettingsAPI interface
6. `src/components/wypalarka/Wypalarka.tsx` - Load on mount
7. `src/components/wypalarka/WypalarkaSettingsModal.tsx` - Save on change
8. `src/localization/i18n.ts` - Add translation keys
