import { BrowserWindow, dialog, ipcMain } from "electron";
import { SETTINGS_CHANNELS } from "./settings-channels";
import { SettingsStore } from "@/helpers/settings/settings-store";

export function addSettingsEventListeners(mainWindow: BrowserWindow) {
  const store = SettingsStore.getInstance();

  ipcMain.handle(SETTINGS_CHANNELS.GET_ALL, async () => {
    return store.getAll();
  });

  ipcMain.handle(SETTINGS_CHANNELS.GET_OUTPUT, async () => {
    return store.getOutput();
  });

  ipcMain.handle(SETTINGS_CHANNELS.UPDATE_OUTPUT, async (_event, partial: any) => {
    const updated = store.updateOutput(partial);
    // broadcast to renderer(s)
    mainWindow.webContents.send(SETTINGS_CHANNELS.OUTPUT_UPDATED, updated);
    return updated;
  });

  ipcMain.handle(SETTINGS_CHANNELS.SELECT_OUTPUT_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select default output folder",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}


