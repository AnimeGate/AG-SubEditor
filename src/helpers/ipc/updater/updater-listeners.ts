import { ipcMain, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { UPDATER_CHANNELS } from "./updater-channels";
import { debugLog } from "../../debug-mode";

// DEV ONLY: Mock update info for testing
const mockUpdateInfo = {
  version: "99.0.0",
  releaseNotes: `# AG-SubEditor v1.9.0 - Changelog

## Wypalarka - Zabezpieczenia przed utratą danych

W tej wersji zająłem się na tym, żeby wypalarka była bardziej "foolproof" i nie traciło się plików przez przypadek.

### Co nowego?

**Sprawdzanie miejsca na dysku:**
- Przed rozpoczęciem enkodowania apka sprawdza czy masz wystarczająco miejsca na dysku
- Szacuje rozmiar pliku na podstawie bitrate i długości wideo
- Jak brakuje miejsca, dostaniesz ostrzeżenie z opcjami:
  - Anuluj operację
  - Zmień lokalizację zapisu
  - Kontynuuj na własne ryzyko (jak jesteś pewny że się zmieści)

**Wykrywanie konfliktu pliku wyjściowego:**
- Jak plik o takiej nazwie już istnieje, apka zapyta co zrobić
- Dostępne opcje:
  - **Nadpisz** – zastąp istniejący plik
  - **Auto-zmień nazwę** – automatycznie doda \`_1\`, \`_2\` itd. do nazwy
  - **Wybierz inną lokalizację** – otwiera dialog zapisu
  - **Anuluj** – wróć do ustawień
- Już nie nadpiszecie sobie przypadkiem wcześniejszego wypalonego pliku

### Techniczne

- Nowe kanały IPC do sprawdzania istnienia plików i rozwiązywania konfliktów
- Nowy komponent \`WypalarkaOutputConflictDialog\`
- Integracja sprawdzania miejsca z kolejką przetwarzania
- Pełna lokalizacja PL/EN dla nowych dialogów`,
  releaseDate: new Date().toISOString(),
};

export function registerUpdaterListeners() {
  // Handle start download command
  ipcMain.on(UPDATER_CHANNELS.START_DOWNLOAD, () => {
    debugLog.info("Auto-updater: Download requested by user");
    autoUpdater.downloadUpdate();
  });

  // Handle install now command
  ipcMain.on(UPDATER_CHANNELS.INSTALL_NOW, () => {
    debugLog.info("Auto-updater: Install now requested by user");
    setImmediate(() => autoUpdater.quitAndInstall());
  });

  // Handle manual check for updates
  ipcMain.on(UPDATER_CHANNELS.CHECK_FOR_UPDATES, () => {
    debugLog.info("Auto-updater: Manual update check requested");
    autoUpdater.checkForUpdates();
  });

  // DEV ONLY: Simulate update flow for testing
  ipcMain.on("updater:simulate-update", () => {
    debugLog.info("Auto-updater: [DEV] Simulating update flow");
    sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_AVAILABLE, mockUpdateInfo);
    debugLog.info("Auto-updater: [DEV] Sent UPDATE_AVAILABLE event");
  });

  // DEV ONLY: Simulate download progress
  ipcMain.on("updater:simulate-download", () => {
    debugLog.info("Auto-updater: [DEV] Simulating download progress");

    let percent = 0;
    const total = 50 * 1024 * 1024; // 50 MB

    const interval = setInterval(() => {
      percent += 5;
      const transferred = (total * percent) / 100;

      sendUpdaterEvent(UPDATER_CHANNELS.DOWNLOAD_PROGRESS, {
        bytesPerSecond: 2 * 1024 * 1024, // 2 MB/s
        percent,
        transferred,
        total,
      });

      if (percent >= 100) {
        clearInterval(interval);
        // Send download complete with same changelog
        sendUpdaterEvent(UPDATER_CHANNELS.UPDATE_DOWNLOADED, mockUpdateInfo);
        debugLog.info("Auto-updater: [DEV] Sent UPDATE_DOWNLOADED event");
      }
    }, 300);
  });
}

/**
 * Send updater event to all renderer windows
 */
export function sendUpdaterEvent(channel: string, data?: unknown) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}
