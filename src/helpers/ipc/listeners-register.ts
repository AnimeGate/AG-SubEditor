import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addFileEventListeners } from "./file/file-listeners";
import { addFfmpegEventListeners } from "./ffmpeg/ffmpeg-listeners";
import { registerDebugListeners } from "./debug/debug-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addFileEventListeners(mainWindow);
  addFfmpegEventListeners(mainWindow);
  registerDebugListeners(mainWindow);
}
