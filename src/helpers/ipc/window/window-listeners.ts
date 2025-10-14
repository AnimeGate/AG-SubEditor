import { BrowserWindow, ipcMain } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
} from "./window-channels";
import { debugLog } from "../../debug-mode";

export function addWindowEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(WIN_MINIMIZE_CHANNEL, () => {
    debugLog.ipc("IPC: WIN_MINIMIZE called - Minimizing window");
    mainWindow.minimize();
  });
  ipcMain.handle(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      debugLog.ipc("IPC: WIN_MAXIMIZE called - Unmaximizing window");
      mainWindow.unmaximize();
    } else {
      debugLog.ipc("IPC: WIN_MAXIMIZE called - Maximizing window");
      mainWindow.maximize();
    }
  });
  ipcMain.handle(WIN_CLOSE_CHANNEL, () => {
    debugLog.ipc("IPC: WIN_CLOSE called - Closing window");
    mainWindow.close();
  });
}
