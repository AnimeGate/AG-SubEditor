import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { BACKGROUND_CHANNELS } from "./background-channels";
import type { BackgroundSettings } from "@/helpers/settings/settings-store";

// Extended type that includes imageData from the IPC response
type BackgroundSettingsWithImage = BackgroundSettings & {
  imageData?: string | null;
};

export function exposeBackgroundContext() {
  contextBridge.exposeInMainWorld("backgroundAPI", {
    get: async (): Promise<BackgroundSettingsWithImage> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.GET),

    update: async (
      partial: Partial<BackgroundSettings>,
    ): Promise<BackgroundSettingsWithImage> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.UPDATE, partial),

    selectImage: async (): Promise<BackgroundSettingsWithImage | null> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.SELECT_IMAGE),

    remove: async (): Promise<void> =>
      ipcRenderer.invoke(BACKGROUND_CHANNELS.REMOVE),

    onUpdated: (callback: (settings: BackgroundSettingsWithImage) => void) => {
      const listener = (
        _e: IpcRendererEvent,
        settings: BackgroundSettingsWithImage,
      ) => callback(settings);
      ipcRenderer.on(BACKGROUND_CHANNELS.UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(BACKGROUND_CHANNELS.UPDATED, listener);
    },
  });
}
