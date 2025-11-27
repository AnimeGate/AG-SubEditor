import { SettingsStore } from "./settings/settings-store";
import { translations, Language } from "@/localization/translations";

// Get singleton instance of settings store
const settingsStore = SettingsStore.getInstance();

interface TranslateOptions {
  count?: number;
  [key: string]: string | number | undefined;
}

/**
 * Get current language from settings store.
 */
function getCurrentLanguage(): Language {
  return settingsStore.getLanguage();
}

/**
 * Handle Polish pluralization rules.
 * Polish has 3 forms: singular (1), few (2-4, 22-24, etc.), many (0, 5-21, 25-31, etc.)
 */
function getPolishPluralKey(count: number, baseKey: string): string {
  if (count === 1) {
    return baseKey;
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // 2-4, 22-24, 32-34, etc. (but not 12-14)
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return `${baseKey}_few`;
  }

  // 0, 5-21, 25-31, etc.
  return `${baseKey}_many`;
}

/**
 * Handle English pluralization (simple singular/plural).
 */
function getEnglishPluralKey(count: number, baseKey: string): string {
  return count === 1 ? baseKey : `${baseKey}_plural`;
}

/**
 * Translate a key with optional interpolation and pluralization.
 *
 * @param key - Translation key like "notificationEncodingCompleteTitle"
 * @param options - Optional interpolation values and count for pluralization
 * @returns Translated string
 *
 * @example
 * t("notificationEncodingCompleteTitle")
 * // => "Wypalanie zakończone!" (Polish) or "Encoding complete!" (English)
 *
 * t("notificationEncodingCompleteBody", { fileName: "video.mp4" })
 * // => "Plik video.mp4 został pomyślnie przetworzony."
 *
 * t("notificationQueueCompleteBody", { count: 5 })
 * // => "Przetworzono 5 plików." (Polish) or "Processed 5 files." (English)
 */
export function t(key: string, options?: TranslateOptions): string {
  const language = getCurrentLanguage();
  const langTranslations = translations[language]?.translation || translations.pl.translation;

  let translationKey = key;

  // Handle pluralization by modifying the key
  if (options?.count !== undefined) {
    if (language === "pl") {
      const pluralKey = getPolishPluralKey(options.count, key);
      // Check if plural form exists, otherwise use base key
      if (pluralKey in langTranslations) {
        translationKey = pluralKey;
      }
    } else {
      const pluralKey = getEnglishPluralKey(options.count, key);
      // Check if plural form exists, otherwise use base key
      if (pluralKey in langTranslations) {
        translationKey = pluralKey;
      }
    }
  }

  let value = langTranslations[translationKey as keyof typeof langTranslations] as string | undefined;

  // Fallback to English if key not found
  if (value === undefined && language !== "en") {
    value = translations.en.translation[translationKey as keyof typeof translations.en.translation] as string | undefined;
  }

  // Still not found, return key
  if (value === undefined) {
    return key;
  }

  // Replace interpolation placeholders {{key}}
  let result = value;
  if (options) {
    for (const [optKey, optValue] of Object.entries(options)) {
      if (optValue !== undefined) {
        result = result.replace(new RegExp(`{{${optKey}}}`, "g"), String(optValue));
      }
    }
  }

  return result;
}
