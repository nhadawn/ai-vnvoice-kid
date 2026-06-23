// Color theme presets — swap CSS variables on :root. Persisted in localStorage.

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  swatch: string[]; // 4 colors for preview
  vars: Record<string, string>;
}

// POS palettes per theme — keeps the Fitzgerald key meaningful while shifting hue
// to match the overall mood the child picked.
const POS_CORAL = {
  "--noun": "oklch(0.84 0.12 60)",
  "--verb": "oklch(0.8 0.15 150)",
  "--adjective": "oklch(0.86 0.13 90)",
  "--phrase": "oklch(0.82 0.11 320)",
  "--pronoun": "oklch(0.82 0.12 230)",
};
const POS_OCEAN = {
  "--noun": "oklch(0.84 0.1 210)",
  "--verb": "oklch(0.82 0.13 175)",
  "--adjective": "oklch(0.88 0.11 95)",
  "--phrase": "oklch(0.82 0.11 270)",
  "--pronoun": "oklch(0.82 0.13 240)",
};
const POS_CANDY = {
  "--noun": "oklch(0.86 0.1 30)",
  "--verb": "oklch(0.84 0.12 150)",
  "--adjective": "oklch(0.88 0.13 80)",
  "--phrase": "oklch(0.82 0.13 310)",
  "--pronoun": "oklch(0.82 0.12 260)",
};
const POS_FOREST = {
  "--noun": "oklch(0.84 0.12 70)",
  "--verb": "oklch(0.8 0.16 145)",
  "--adjective": "oklch(0.86 0.13 100)",
  "--phrase": "oklch(0.8 0.1 200)",
  "--pronoun": "oklch(0.82 0.11 220)",
};
const POS_NIGHT = {
  "--noun": "oklch(0.55 0.13 60)",
  "--verb": "oklch(0.55 0.15 150)",
  "--adjective": "oklch(0.6 0.13 90)",
  "--phrase": "oklch(0.55 0.13 310)",
  "--pronoun": "oklch(0.55 0.13 240)",
};

export const THEMES: ThemePreset[] = [
  {
    id: "coral",
    name: "San hô ấm",
    emoji: "🪸",
    swatch: ["#ff8a6b", "#7dd3c5", "#ffd96b", "#fff7ec"],
    vars: {
      "--background": "oklch(0.985 0.012 85)",
      "--foreground": "oklch(0.28 0.04 260)",
      "--primary": "oklch(0.72 0.16 35)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.78 0.13 195)",
      "--accent": "oklch(0.86 0.13 90)",
      "--ring": "oklch(0.72 0.16 35)",
      ...POS_CORAL,
    },
  },
  {
    id: "ocean",
    name: "Đại dương",
    emoji: "🌊",
    swatch: ["#5ab8e8", "#7de3c5", "#ffd96b", "#eef7fb"],
    vars: {
      "--background": "oklch(0.975 0.015 220)",
      "--foreground": "oklch(0.25 0.06 250)",
      "--primary": "oklch(0.68 0.15 230)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.8 0.13 170)",
      "--accent": "oklch(0.86 0.13 90)",
      "--ring": "oklch(0.68 0.15 230)",
      ...POS_OCEAN,
    },
  },
  {
    id: "candy",
    name: "Kẹo ngọt",
    emoji: "🍬",
    swatch: ["#ff8fbf", "#c79bff", "#ffd96b", "#fff0f7"],
    vars: {
      "--background": "oklch(0.98 0.015 350)",
      "--foreground": "oklch(0.28 0.06 320)",
      "--primary": "oklch(0.74 0.18 350)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.76 0.14 305)",
      "--accent": "oklch(0.86 0.13 90)",
      "--ring": "oklch(0.74 0.18 350)",
      ...POS_CANDY,
    },
  },
  {
    id: "forest",
    name: "Rừng xanh",
    emoji: "🌳",
    swatch: ["#6ec07a", "#f0b86a", "#a8d8a8", "#f3f7ec"],
    vars: {
      "--background": "oklch(0.975 0.018 120)",
      "--foreground": "oklch(0.26 0.05 150)",
      "--primary": "oklch(0.68 0.15 145)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.78 0.12 70)",
      "--accent": "oklch(0.82 0.13 90)",
      "--ring": "oklch(0.68 0.15 145)",
      ...POS_FOREST,
    },
  },
  {
    id: "night",
    name: "Đêm dịu",
    emoji: "🌙",
    swatch: ["#8aa9ff", "#b893ff", "#2a2f4a", "#1a1d2e"],
    vars: {
      "--background": "oklch(0.22 0.03 270)",
      "--foreground": "oklch(0.95 0.02 250)",
      "--card": "oklch(0.28 0.035 270)",
      "--card-foreground": "oklch(0.95 0.02 250)",
      "--popover": "oklch(0.28 0.035 270)",
      "--popover-foreground": "oklch(0.95 0.02 250)",
      "--muted": "oklch(0.32 0.03 270)",
      "--muted-foreground": "oklch(0.75 0.03 260)",
      "--border": "oklch(0.38 0.04 270)",
      "--input": "oklch(0.32 0.03 270)",
      "--primary": "oklch(0.74 0.16 270)",
      "--primary-foreground": "oklch(0.15 0.02 270)",
      "--secondary": "oklch(0.6 0.14 310)",
      "--accent": "oklch(0.7 0.15 60)",
      "--ring": "oklch(0.74 0.16 270)",
      ...POS_NIGHT,
    },
  },
];

const STORAGE_KEY = "aac-theme";

export function applyTheme(id: string) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  const root = document.documentElement;
  // Reset all known vars first so switching from "night" doesn't leak dark surfaces.
  const allKeys = new Set<string>();
  THEMES.forEach((th) => Object.keys(th.vars).forEach((k) => allKeys.add(k)));
  allKeys.forEach((k) => root.style.removeProperty(k));
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* noop */ }
}

export function getStoredTheme(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? "coral"; } catch { return "coral"; }
}
