import { ThemeMode } from "@/types/theme-mode";

const THEME_KEY = "theme";

export interface ThemePreferences {
  system: ThemeMode;
  local: ThemeMode | null;
}

/**
 * Get the theme stored in localStorage synchronously
 */
export function getLocalTheme(): ThemeMode | null {
  return localStorage.getItem(THEME_KEY) as ThemeMode | null;
}

export async function getCurrentTheme(): Promise<ThemePreferences> {
  const currentTheme = await window.themeMode.current();
  const localTheme = getLocalTheme();

  return {
    system: currentTheme,
    local: localTheme,
  };
}

export async function setTheme(newTheme: ThemeMode) {
  switch (newTheme) {
    case "dark":
      await window.themeMode.dark();
      updateDocumentTheme(true);
      break;
    case "light":
      await window.themeMode.light();
      updateDocumentTheme(false);
      break;
    case "system": {
      const isDarkMode = await window.themeMode.system();
      updateDocumentTheme(isDarkMode);
      break;
    }
  }

  localStorage.setItem(THEME_KEY, newTheme);
}

export async function toggleTheme() {
  const isDarkMode = await window.themeMode.toggle();
  const newTheme = isDarkMode ? "dark" : "light";

  updateDocumentTheme(isDarkMode);
  localStorage.setItem(THEME_KEY, newTheme);
}

/**
 * Apply theme immediately from localStorage (synchronous, for initial render).
 * This ensures the UI has the correct theme class before React renders.
 */
export function applyThemeImmediately(): void {
  const localTheme = getLocalTheme();
  if (localTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (localTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // System theme - check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export async function syncThemeWithLocal() {
  const localTheme = getLocalTheme();

  // First, immediately apply the document class for consistent UI
  applyThemeImmediately();

  // Then sync with native theme (for Electron dialogs, etc.)
  try {
    if (!localTheme) {
      await setTheme("system");
      return;
    }
    await setTheme(localTheme);
  } catch (error) {
    console.error("Failed to sync theme with native:", error);
    // UI theme class is already applied, so the app will still look correct
  }
}

function updateDocumentTheme(isDarkMode: boolean) {
  if (!isDarkMode) {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
}
