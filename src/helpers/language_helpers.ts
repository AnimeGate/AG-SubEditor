import type { i18n } from "i18next";

const languageLocalStorageKey = "lang";

export function setAppLanguage(lang: string, i18n: i18n) {
  localStorage.setItem(languageLocalStorageKey, lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;

  // Sync to main process for notifications
  if (window.settingsAPI && (lang === "pl" || lang === "en")) {
    window.settingsAPI.setLanguage(lang);
  }
}

export async function updateAppLanguage(i18n: i18n) {
  // First try to get language from main process (persistent storage)
  let lang: string | null = null;

  if (window.settingsAPI) {
    try {
      lang = await window.settingsAPI.getLanguage();
    } catch {
      // Fallback to localStorage if IPC fails
    }
  }

  // Fallback to localStorage
  if (!lang) {
    lang = localStorage.getItem(languageLocalStorageKey);
  }

  if (!lang) {
    return;
  }

  // Sync localStorage with main process value
  localStorage.setItem(languageLocalStorageKey, lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}
