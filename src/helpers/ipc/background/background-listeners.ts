import { BrowserWindow, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { BACKGROUND_CHANNELS } from "./background-channels";
import {
  SettingsStore,
  BackgroundSettings,
} from "@/helpers/settings/settings-store";
import { debugLog } from "@/helpers/debug-mode";

function getImageAsBase64(imagePath: string | null): string | null {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return null;
  }
  try {
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeType =
      ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : `image/${ext}`;
    const imageBuffer = fs.readFileSync(imagePath);
    return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export function addBackgroundEventListeners(mainWindow: BrowserWindow) {
  const store = SettingsStore.getInstance();

  ipcMain.handle(BACKGROUND_CHANNELS.GET, async () => {
    debugLog.ipc("IPC: BACKGROUND_GET called");
    const settings = store.getBackground();
    return {
      ...settings,
      imageData: getImageAsBase64(settings.imagePath),
    };
  });

  ipcMain.handle(BACKGROUND_CHANNELS.GET_IMAGE_DATA, async () => {
    debugLog.ipc("IPC: BACKGROUND_GET_IMAGE_DATA called");
    const settings = store.getBackground();
    return getImageAsBase64(settings.imagePath);
  });

  ipcMain.handle(
    BACKGROUND_CHANNELS.UPDATE,
    async (_event, partial: Partial<BackgroundSettings>) => {
      debugLog.ipc("IPC: BACKGROUND_UPDATE called");
      const updated = store.updateBackground(partial);
      const withImageData = {
        ...updated,
        imageData: getImageAsBase64(updated.imagePath),
      };
      mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, withImageData);
      return withImageData;
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

      const withImageData = {
        ...updated,
        imageData: getImageAsBase64(destPath),
      };

      mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, withImageData);

      return withImageData;
    } catch (error) {
      debugLog.error(`Failed to copy background image: ${error}`);
      return null;
    }
  });

  ipcMain.handle(BACKGROUND_CHANNELS.REMOVE, async () => {
    debugLog.ipc("IPC: BACKGROUND_REMOVE called");
    store.removeBackgroundImage();
    const updated = store.getBackground();
    const withImageData = {
      ...updated,
      imageData: null,
    };
    mainWindow.webContents.send(BACKGROUND_CHANNELS.UPDATED, withImageData);
    debugLog.success("Background removed successfully");
  });
}
