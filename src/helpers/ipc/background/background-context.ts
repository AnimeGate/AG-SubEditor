import { contextBridge, ipcRenderer } from "electron";
import { BACKGROUND_CHANNELS } from "./background-channels";
import type { BackgroundSettings } from "@/helpers/settings/settings-store";

export function exposeBackgroundContext() {
  contextBridge.exposeInMainWorld("backgroundAPI", {
    get: async (): Promise<BackgroundSettings> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.GET),

    update: async (
      partial: Partial<BackgroundSettings>,
    ): Promise<BackgroundSettings> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.UPDATE, partial),

    selectImage: async (): Promise<string | null> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.SELECT_IMAGE),

    remove: async (): Promise<void> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.REMOVE),

    onUpdated: (callback: (settings: BackgroundSettings) => void) => {
      const listener = (_e: any, settings: BackgroundSettings) =>
        callback(settings);
      ipcRenderer.on(BACKGROUND_CHANNELS.UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(BACKGROUND_CHANNELS.UPDATED, listener);
    },
  });
}
