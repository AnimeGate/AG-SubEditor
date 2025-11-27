import { nativeTheme } from "electron";
import { ipcMain } from "electron";
import { debugLog } from "../../debug-mode";
import {
  THEME_MODE_CURRENT_CHANNEL,
  THEME_MODE_DARK_CHANNEL,
  THEME_MODE_LIGHT_CHANNEL,
  THEME_MODE_SYSTEM_CHANNEL,
  THEME_MODE_TOGGLE_CHANNEL,
} from "./theme-channels";

export function addThemeEventListeners() {
  ipcMain.handle(THEME_MODE_CURRENT_CHANNEL, () => {
    debugLog.ipc(
      `IPC: THEME_CURRENT called - Current theme: ${nativeTheme.themeSource}`,
    );
    return nativeTheme.themeSource;
  });

  ipcMain.handle(THEME_MODE_TOGGLE_CHANNEL, () => {
    const oldTheme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = "light";
    } else {
      nativeTheme.themeSource = "dark";
    }
    const newTheme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    debugLog.ipc(
      `IPC: THEME_TOGGLE called - Changed from ${oldTheme} to ${newTheme}`,
    );
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle(THEME_MODE_DARK_CHANNEL, () => {
    debugLog.ipc("IPC: THEME_DARK called - Switching to dark mode");
    nativeTheme.themeSource = "dark";
  });

  ipcMain.handle(THEME_MODE_LIGHT_CHANNEL, () => {
    debugLog.ipc("IPC: THEME_LIGHT called - Switching to light mode");
    nativeTheme.themeSource = "light";
  });

  ipcMain.handle(THEME_MODE_SYSTEM_CHANNEL, () => {
    debugLog.ipc("IPC: THEME_SYSTEM called - Switching to system theme");
    nativeTheme.themeSource = "system";
    const isDark = nativeTheme.shouldUseDarkColors;
    debugLog.ipc(
      `IPC: THEME_SYSTEM - System is using ${isDark ? "dark" : "light"} mode`,
    );
    return isDark;
  });
}
