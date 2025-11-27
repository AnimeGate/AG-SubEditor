import { contextBridge, ipcRenderer, webUtils } from "electron";
import { FILE_CHANNELS } from "./file-channels";

export function exposeFileContext() {
  contextBridge.exposeInMainWorld("fileAPI", {
    openFile: async () => {
      return await ipcRenderer.invoke(FILE_CHANNELS.OPEN_FILE);
    },
    saveFile: async (fileName: string, content: string) => {
      return await ipcRenderer.invoke(
        FILE_CHANNELS.SAVE_FILE,
        fileName,
        content,
      );
    },
    /**
     * Get the filesystem path from a dropped File object.
     * In modern Electron, File.path is no longer available - use webUtils instead.
     */
    getPathForFile: (file: File): string => {
      return webUtils.getPathForFile(file);
    },
  });
}
