import { BrowserWindow, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { BACKGROUND_CHANNELS } from "./background-channels";
import {
  SettingsStore,
  BackgroundSettings,
} from "@/helpers/settings/settings-store";
import { debugLog } from "@/helpers/debug-mode";

export function addBackgroundEventListeners(mainWindow: BrowserWindow) {
  const store = SettingsStore.getInstance();

  ipcMain.handle(BACKGROUND_CHANNELS.GET, async () => {
    debugLog.ipc("IPC: BACKGROUND_GET called");
    return store.getBackground();
  });

  ipcMain.handle(
    BACKGROUND_CHANNELS.UPDATE,
    async (_event, partial: Partial<BackgroundSettings>) => {
      debugLog.ipc("IPC: BACKGROUND_UPDATE called");
      const updated = store.updateBackground(partial);
      mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, updated);
      return updated;
    },
  );

  ipcMain.handle(BACKGROUND_CHANNELS.SELECT_IMAGE, async () => {
    debugLog.ipc("IPC: BACKGROUND_SELECT_IMAGE called");

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"],
        },
      ],
      title: "Select background image",
    });

    if (result.canceled || result.filePaths.length === 0) {
      debugLog.ipc("IPC: BACKGROUND_SELECT_IMAGE - User cancelled");
      return null;
    }

    const sourcePath = result.filePaths[0];
    const fileName = path.basename(sourcePath);
    const ext = path.extname(fileName);
    const backgroundsDir = store.getBackgroundsDir();

    // Create backgrounds directory if it doesn't exist
    if (!fs.existsSync(backgroundsDir)) {
      fs.mkdirSync(backgroundsDir, { recursive: true });
    }

    // Remove old background image if exists
    const currentBackground = store.getBackground();
    if (
      currentBackground.imagePath &&
      fs.existsSync(currentBackground.imagePath)
    ) {
      try {
        fs.unlinkSync(currentBackground.imagePath);
        debugLog.file(`Removed old background: ${currentBackground.imagePath}`);
      } catch {
        // ignore deletion errors
      }
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const newFileName = `background-${timestamp}${ext}`;
    const destPath = path.join(backgroundsDir, newFileName);

    // Copy image to appdata
    try {
      fs.copyFileSync(sourcePath, destPath);
      debugLog.file(`Copied background image to: ${destPath}`);

      // Update settings with new path
      const updated = store.updateBackground({
        imagePath: destPath,
        enabled: true,
      });

      mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, updated);

      return destPath;
    } catch (error) {
      debugLog.error(`Failed to copy background image: ${error}`);
      return null;
    }
  });

  ipcMain.handle(BACKGROUND_CHANNELS.REMOVE, async () => {
    debugLog.ipc("IPC: BACKGROUND_REMOVE called");
    store.removeBackgroundImage();
    const updated = store.getBackground();
    mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, updated);
    debugLog.success("Background removed successfully");
  });
}
