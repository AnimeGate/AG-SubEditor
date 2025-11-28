import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export type OutputSettings = {
  locationMode: "same_as_input" | "custom_folder" | "input_subfolder";
  customFolder: string | null;
  filenamePrefix: string;
};

export type BackgroundSettings = {
  enabled: boolean;
  imagePath: string | null; // Path to copied image in appdata
  opacity: number; // 0.0 - 1.0 for overlay darkness
};

export type AppSettings = {
  output: OutputSettings;
  language: "pl" | "en";
  background: BackgroundSettings;
};

const DEFAULT_BACKGROUND: BackgroundSettings = {
  enabled: false,
  imagePath: null,
  opacity: 0.3, // 30% opacity by default
};

const DEFAULT_SETTINGS: AppSettings = {
  output: {
    locationMode: "same_as_input",
    customFolder: null,
    filenamePrefix: "", // no prefix by default
  },
  language: "pl", // Default to Polish
  background: DEFAULT_BACKGROUND,
};

export class SettingsStore {
  private static instance: SettingsStore | null = null;
  private settingsPath: string;
  private cache: AppSettings | null = null;

  private constructor() {
    const userData = app.getPath("userData");
    this.settingsPath = path.join(userData, "settings.json");
  }

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private readFromDisk(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, "utf-8");
        const data = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...data,
          output: { ...DEFAULT_SETTINGS.output, ...(data.output || {}) },
          background: { ...DEFAULT_BACKGROUND, ...(data.background || {}) },
        } as AppSettings;
      }
    } catch {
      // fallthrough to default
    }
    return { ...DEFAULT_SETTINGS };
  }

  private writeToDisk(settings: AppSettings) {
    try {
      const dir = path.dirname(this.settingsPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        "utf-8",
      );
    } catch {
      // ignore write errors; best-effort persistence
    }
  }

  getAll(): AppSettings {
    if (!this.cache) {
      this.cache = this.readFromDisk();
    }
    return this.cache;
  }

  getOutput(): OutputSettings {
    return this.getAll().output;
  }

  updateOutput(partial: Partial<OutputSettings>): OutputSettings {
    const current = this.getAll();
    const updated: AppSettings = {
      ...current,
      output: { ...current.output, ...partial },
    };
    this.cache = updated;
    this.writeToDisk(updated);
    return updated.output;
  }

  getLanguage(): "pl" | "en" {
    return this.getAll().language;
  }

  setLanguage(lang: "pl" | "en"): void {
    const current = this.getAll();
    const updated: AppSettings = {
      ...current,
      language: lang,
    };
    this.cache = updated;
    this.writeToDisk(updated);
  }

  getBackground(): BackgroundSettings {
    return this.getAll().background;
  }

  updateBackground(partial: Partial<BackgroundSettings>): BackgroundSettings {
    const current = this.getAll();
    const updated: AppSettings = {
      ...current,
      background: { ...current.background, ...partial },
    };
    this.cache = updated;
    this.writeToDisk(updated);
    return updated.background;
  }

  getBackgroundsDir(): string {
    const userData = app.getPath("userData");
    return path.join(userData, "backgrounds");
  }

  removeBackgroundImage(): void {
    const current = this.getBackground();
    if (current.imagePath && fs.existsSync(current.imagePath)) {
      try {
        fs.unlinkSync(current.imagePath);
      } catch {
        // ignore deletion errors
      }
    }
    this.updateBackground({
      enabled: false,
      imagePath: null,
    });
  }
}
