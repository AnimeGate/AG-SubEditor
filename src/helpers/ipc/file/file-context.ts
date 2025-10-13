import { contextBridge, ipcRenderer } from "electron";
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
        content
      );
    },
  });
}
