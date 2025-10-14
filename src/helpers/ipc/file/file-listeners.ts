import { BrowserWindow, dialog, ipcMain } from "electron";
import { FILE_CHANNELS } from "./file-channels";
import { debugLog } from "../../debug-mode";
import * as fs from "fs";

export function addFileEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(FILE_CHANNELS.OPEN_FILE, async () => {
    debugLog.ipc("IPC: OPEN_FILE called");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "ASS Subtitles", extensions: ["ass"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      debugLog.ipc("IPC: OPEN_FILE - User cancelled");
      return null;
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = filePath.split(/[\\/]/).pop() || "subtitles.ass";

    debugLog.ipc(`IPC: OPEN_FILE - Loaded: ${fileName} (${content.length} bytes)`);
    return { fileName, content };
  });

  ipcMain.handle(
    FILE_CHANNELS.SAVE_FILE,
    async (_event, fileName: string, content: string) => {
      debugLog.ipc(`IPC: SAVE_FILE called: ${fileName} (${content.length} bytes)`);
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: fileName,
        filters: [
          { name: "ASS Subtitles", extensions: ["ass"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        debugLog.ipc("IPC: SAVE_FILE - User cancelled");
        return false;
      }

      fs.writeFileSync(result.filePath, content, "utf-8");
      debugLog.ipc(`IPC: SAVE_FILE - Saved to: ${result.filePath}`);
      return true;
    }
  );
}
