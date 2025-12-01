import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export type AppSettings = {
  language: "pl" | "en";
};

const DEFAULT_SETTINGS: AppSettings = {
  language: "pl", // Default to Polish
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
}
