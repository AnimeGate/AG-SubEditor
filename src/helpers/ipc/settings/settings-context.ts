import { contextBridge, ipcRenderer } from "electron";
import { SETTINGS_CHANNELS } from "./settings-channels";

export function exposeSettingsContext() {
  contextBridge.exposeInMainWorld("settingsAPI", {
    getAll: async () => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_ALL),
    getOutput: async () => ipcRenderer.invoke(SETTINGS_CHANNELS.GET_OUTPUT),
    updateOutput: async (partial: any) =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.UPDATE_OUTPUT, partial),
    selectOutputFolder: async () =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.SELECT_OUTPUT_FOLDER),
    onOutputUpdated: (callback: (output: any) => void) => {
      const listener = (_e: any, output: any) => callback(output);
      ipcRenderer.on(SETTINGS_CHANNELS.OUTPUT_UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(SETTINGS_CHANNELS.OUTPUT_UPDATED, listener);
    },
    getLanguage: async (): Promise<"pl" | "en"> =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.GET_LANGUAGE),
    setLanguage: async (lang: "pl" | "en"): Promise<"pl" | "en"> =>
      ipcRenderer.invoke(SETTINGS_CHANNELS.SET_LANGUAGE, lang),
  });
}
