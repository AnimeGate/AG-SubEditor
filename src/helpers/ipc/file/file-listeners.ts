import { BrowserWindow, dialog, ipcMain } from "electron";
import { FILE_CHANNELS } from "./file-channels";
import * as fs from "fs";

export function addFileEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(FILE_CHANNELS.OPEN_FILE, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "ASS Subtitles", extensions: ["ass"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = filePath.split(/[\\/]/).pop() || "subtitles.ass";

    return { fileName, content };
  });

  ipcMain.handle(
    FILE_CHANNELS.SAVE_FILE,
    async (_event, fileName: string, content: string) => {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: fileName,
        filters: [
          { name: "ASS Subtitles", extensions: ["ass"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return false;
      }

      fs.writeFileSync(result.filePath, content, "utf-8");
      return true;
    }
  );
}
