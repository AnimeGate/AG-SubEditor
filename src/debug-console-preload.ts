import { ipcRenderer } from "electron";

// Listen for log messages from main process and dispatch to window
ipcRenderer.on("debug:log", (_event, data: { level: string; message: string; args: unknown[] }) => {
  // Dispatch custom event to the window
  window.dispatchEvent(
    new CustomEvent("log", {
      detail: data,
    })
  );
});
