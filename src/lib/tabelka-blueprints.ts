/**
 * Embedded blueprints for the ASS Table Generator
 * Each blueprint contains styling templates - user provides the text content
 */

export interface Blueprint {
  id: string;
  name: string;
  // Style prefix for title (applied before user text)
  titleStyle: string;
  // Style prefix for content
  contentStyle: string;
  // Style prefix for description
  descriptionStyle: string;
  // Default values for new users
  defaults: {
    title: string;
    content: string;
    description: string;
  };
}

export const BLUEPRINTS: Blueprint[] = [
  {
    id: "animegate",
    name: "AnimeGATE",
    titleStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs108}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "AnimeGATE",
      content: "Lektor: <MR_204>",
      description: "Discord: discord.gg/AnimeGate",
    },
  },
  {
    id: "animesubs-info",
    name: "AnimeSubs.info",
    titleStyle: String.raw`{\4c&H75605D&\3c&H310E61&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs76}`,
    contentStyle: String.raw`{\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\fnTahoma\b1\fs48}`,
    defaults: {
      title: "AnimeSubs.info",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Strona: AnimeSubs.info",
    },
  },
  {
    id: "biblioteka-nyaa",
    name: "Biblioteka Nyaa",
    titleStyle: String.raw`{\2c&H275886&\4c&H0C0B0B&\3c&H4AA0B3&\1c&H275BDE&\3a&H00&\fnTahoma\b1\fs66}`,
    contentStyle: String.raw`{\2c&H2D5ACE&\4c&H25C596&\3c&H000000&\1c&H0000FF&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\4c&H4D5053&\3c&H000000&\1c&H0559F1&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "Biblioteka Nyaa",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Strona: https://nyaa.si/",
    },
  },
  {
    id: "demo-subs",
    name: "Demo Subs",
    titleStyle: String.raw`{\4c&H75605D&\3c&H0D0D5A&\1c&H4B4CE6&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H0D0D5A&\1c&H4B4CE6&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H0D0D5A&\1c&H4B4CE6&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "Demo Subs",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/demosubs",
    },
  },
  {
    id: "desu-online",
    name: "Desu-Online",
    titleStyle: String.raw`{\bord5\4c&H75605D&\3c&HB27733&\1c&HEDEDED&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\bord5\4c&H75605D&\3c&HB27733&\1c&HEDEDED&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\bord5\4c&H75605D&\3c&HB27733&\1c&HEDEDED&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "Desu-Online",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/fuFwbwjDNV",
    },
  },
  {
    id: "frixysubs",
    name: "FrixySubs",
    titleStyle: String.raw`{\4c&H75605D&\3c&H052D39&\1c&H1DADFF&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H052D39&\1c&H1DADFF&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H052D39&\1c&H1DADFF&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "FrixySubs",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/frixysubs",
    },
  },
  {
    id: "lycoriscafe",
    name: "LycorisCafé",
    titleStyle: String.raw`{\4c&H75605D&\3c&H310E61&\1c&H7646FF&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H310E61&\1c&H7646FF&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H310E61&\1c&H7646FF&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "LycorisCafé",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/54ea46RHxb",
    },
  },
  {
    id: "shisha",
    name: "Shisha",
    titleStyle: String.raw`{\4c&H75605D&\3c&H60660C&\1c&HFFFC8A&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H60660C&\1c&HFFFC8A&\3a&H00&\fnTahoma\b1\fs58}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H60660C&\1c&HFFFC8A&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "Shisha",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/szisza",
    },
  },
  {
    id: "custom",
    name: "Własny",
    titleStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs89}`,
    contentStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs108}`,
    descriptionStyle: String.raw`{\4c&H75605D&\3c&H57423F&\1c&HFFBE74&\3a&H00&\fnTahoma\b1\fs48}`,
    defaults: {
      title: "Nazwa Grupy",
      content: "Tłumacz: <...> \\N\\N Korekta: <...>\\N\\N TypeSettings: <...>",
      description: "Discord: discord.gg/...",
    },
  },
];

/**
 * Resolution presets for common video formats
 */
export interface ResolutionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: "1080p", name: "1920×1080 (Full HD)", width: 1920, height: 1080 },
  { id: "1080p-cinema", name: "1920×820 (Kinowe 1080p)", width: 1920, height: 820 },
  { id: "4k", name: "3840×2160 (4K)", width: 3840, height: 2160 },
  { id: "4k-cinema", name: "3840×1640 (Kinowe 4K)", width: 3840, height: 1640 },
  { id: "custom", name: "Własne", width: 1920, height: 1080 },
];

/**
 * Get a blueprint by ID
 */
export function getBlueprintById(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((bp) => bp.id === id);
}

/**
 * Get a resolution preset by ID
 */
export function getResolutionPresetById(
  id: string
): ResolutionPreset | undefined {
  return RESOLUTION_PRESETS.find((preset) => preset.id === id);
}

/**
 * LocalStorage key for saving blueprint content
 */
const STORAGE_KEY = "tabelka-blueprint-content";

export interface SavedBlueprintContent {
  [blueprintId: string]: {
    title: string;
    content: string;
    description: string;
  };
}

/**
 * Load saved content for all blueprints from localStorage
 */
export function loadSavedContent(): SavedBlueprintContent {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved blueprint content:", e);
  }
  return {};
}

/**
 * Save content for a specific blueprint to localStorage
 */
export function saveContentForBlueprint(
  blueprintId: string,
  content: { title: string; content: string; description: string }
): void {
  try {
    const saved = loadSavedContent();
    saved[blueprintId] = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {
    console.error("Failed to save blueprint content:", e);
  }
}

/**
 * Get content for a blueprint (saved or default)
 */
export function getContentForBlueprint(blueprintId: string): {
  title: string;
  content: string;
  description: string;
} {
  const saved = loadSavedContent();
  if (saved[blueprintId]) {
    return saved[blueprintId];
  }

  const blueprint = getBlueprintById(blueprintId);
  if (blueprint) {
    return blueprint.defaults;
  }

  return {
    title: "Nazwa Grupy",
    content: "Zawartość",
    description: "Opis",
  };
}
