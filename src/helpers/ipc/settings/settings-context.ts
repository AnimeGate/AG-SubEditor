import { contextBridge, ipcRenderer } from "electron";
import { SETTINGS_CHANNELS } from "./settings-channels";

export function exposeSettingsContext() {
  contextBridge.exposeInMainWorld("settingsAPI", {
    getLanguage: async (): Promise<"pl" | "en"> =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.GET_LANGUAGE),
    setLanguage: async (lang: "pl" | "en"): Promise<"pl" | "en"> =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.SET_LANGUAGE, lang),
  });
}
