import { app, BrowserWindow } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import { initializeAutoUpdater } from "./helpers/updater/auto-updater";
// "electron-squirrel-startup" seems broken when packaging with vite
//import started from "electron-squirrel-startup";
import path from "path";

const inDevelopment = process.env.NODE_ENV === "development";

// Set app name for notifications and taskbar
app.setName("AG-SubEditor");

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "AG-SubEditor",
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });
  registerListeners(mainWindow);

  // In development: load from vite dev server
  // In production: load from dist folder
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

async function installExtensions() {
  // Only install devtools in development mode
  if (!inDevelopment) {
    return;
  }

  try {
    // Dynamically import electron-devtools-installer only in development
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
      "electron-devtools-installer"
    );
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch (error) {
    console.error("Failed to install extensions:", error);
  }
}

app
  .whenReady()
  .then(createWindow)
  .then(installExtensions)
  .then(() => {
    // Initialize auto-updater after app is ready
    initializeAutoUpdater(inDevelopment);
  });

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
