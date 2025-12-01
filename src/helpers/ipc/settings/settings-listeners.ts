import { BrowserWindow, ipcMain } from "electron";
import { SETTINGS_CHANNELS } from "./settings-channels";
import { SettingsStore } from "@/helpers/settings/settings-store";

export function addSettingsEventListeners(_mainWindow: BrowserWindow) {
  const store = SettingsStore.getInstance();

  ipcMain.handle(SETTINGS_CHANNELS.GET_LANGUAGE, async () => {
    return store.getLanguage();
  });

  ipcMain.handle(
    SETTINGS_CHANNELS.SET_LANGUAGE,
    async (_event, lang: "pl" | "en") => {
      store.setLanguage(lang);
      return lang;
    },
  );
}
