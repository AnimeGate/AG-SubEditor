import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  syncThemeWithLocal,
  applyThemeImmediately,
} from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import { updateAppLanguage } from "./helpers/language_helpers";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./utils/routes";
import { UpdateDialog } from "./components/UpdateDialog";
import { ProcessingProvider } from "./contexts/ProcessingContext";
import "./localization/i18n";

// Apply theme immediately before React renders to avoid flash of wrong theme
applyThemeImmediately();

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync theme with native Electron (for dialogs, etc.)
    syncThemeWithLocal();
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <ProcessingProvider>
      <RouterProvider router={router} />
      <UpdateDialog />
    </ProcessingProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
