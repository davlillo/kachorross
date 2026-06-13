import type { PaletteConfig } from './types';

/**
 * 10 predefined clinic color palettes.
 * Each palette defines light and dark variants of brand tokens.
 *
 * Púrpura light values MUST match the current :root HSL in src/index.css
 * to guarantee zero visual change for existing clinics (REQ-6).
 */

export const PRESETS: PaletteConfig[] = [
  // ─── 1. PÚRPURA (Default — matches current :root) ───
  {
    id: 'purpura',
    name: 'Púrpura',
    colors: {
      light: {
        primary: '270 75% 42%',
        secondary: '45 100% 52%',
        surface: '270 25% 98%',
        text: '270 20% 15%',
        muted: '270 20% 95%',
        accent: '45 100% 52%',
        border: '270 20% 88%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '270 20% 25%',
        'sidebar-primary': '270 75% 42%',
        'sidebar-accent': '45 100% 52%',
      },
      dark: {
        primary: '270 70% 60%',
        secondary: '45 80% 48%',
        surface: '270 15% 10%',
        text: '270 20% 90%',
        muted: '270 15% 18%',
        accent: '45 80% 48%',
        border: '270 15% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '270 15% 8%',
        'sidebar-foreground': '270 20% 80%',
        'sidebar-primary': '270 70% 60%',
        'sidebar-accent': '45 80% 48%',
      },
    },
  },

  // ─── 2. OCEAN (blues) ───
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      light: {
        primary: '210 80% 38%',
        secondary: '180 60% 40%',
        surface: '210 30% 97%',
        text: '210 30% 12%',
        muted: '210 20% 94%',
        accent: '180 60% 40%',
        border: '210 20% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '210 30% 22%',
        'sidebar-primary': '210 80% 38%',
        'sidebar-accent': '180 60% 40%',
      },
      dark: {
        primary: '210 70% 55%',
        secondary: '180 50% 42%',
        surface: '210 15% 10%',
        text: '210 20% 90%',
        muted: '210 15% 18%',
        accent: '180 50% 42%',
        border: '210 15% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '210 15% 8%',
        'sidebar-foreground': '210 20% 80%',
        'sidebar-primary': '210 70% 55%',
        'sidebar-accent': '180 50% 42%',
      },
    },
  },

  // ─── 3. FOREST (greens) ───
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      light: {
        primary: '150 60% 32%',
        secondary: '90 50% 42%',
        surface: '150 25% 97%',
        text: '150 30% 12%',
        muted: '150 15% 94%',
        accent: '90 50% 42%',
        border: '150 15% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '150 30% 22%',
        'sidebar-primary': '150 60% 32%',
        'sidebar-accent': '90 50% 42%',
      },
      dark: {
        primary: '150 55% 50%',
        secondary: '90 45% 42%',
        surface: '150 12% 10%',
        text: '150 20% 90%',
        muted: '150 12% 18%',
        accent: '90 45% 42%',
        border: '150 12% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '150 12% 8%',
        'sidebar-foreground': '150 20% 80%',
        'sidebar-primary': '150 55% 50%',
        'sidebar-accent': '90 45% 42%',
      },
    },
  },

  // ─── 4. SUNSET (warm oranges) ───
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      light: {
        primary: '20 90% 45%',
        secondary: '10 80% 50%',
        surface: '25 30% 97%',
        text: '20 30% 12%',
        muted: '25 20% 94%',
        accent: '10 80% 50%',
        border: '25 20% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '20 30% 22%',
        'sidebar-primary': '20 90% 45%',
        'sidebar-accent': '10 80% 50%',
      },
      dark: {
        primary: '20 80% 55%',
        secondary: '10 70% 52%',
        surface: '20 12% 10%',
        text: '20 20% 90%',
        muted: '20 12% 18%',
        accent: '10 70% 52%',
        border: '20 12% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '20 12% 8%',
        'sidebar-foreground': '20 20% 80%',
        'sidebar-primary': '20 80% 55%',
        'sidebar-accent': '10 70% 52%',
      },
    },
  },

  // ─── 5. MIDNIGHT (deep navy) ───
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      light: {
        primary: '230 70% 35%',
        secondary: '200 60% 45%',
        surface: '230 20% 97%',
        text: '230 30% 12%',
        muted: '230 15% 94%',
        accent: '200 60% 45%',
        border: '230 15% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '230 30% 22%',
        'sidebar-primary': '230 70% 35%',
        'sidebar-accent': '200 60% 45%',
      },
      dark: {
        primary: '230 65% 62%',
        secondary: '200 55% 48%',
        surface: '230 10% 10%',
        text: '230 20% 90%',
        muted: '230 10% 18%',
        accent: '200 55% 48%',
        border: '230 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '230 10% 8%',
        'sidebar-foreground': '230 20% 80%',
        'sidebar-primary': '230 65% 62%',
        'sidebar-accent': '200 55% 48%',
      },
    },
  },

  // ─── 6. ROSE (soft pinks) ───
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      light: {
        primary: '340 70% 48%',
        secondary: '320 50% 46%',
        surface: '340 25% 97%',
        text: '340 30% 12%',
        muted: '340 15% 94%',
        accent: '320 50% 46%',
        border: '340 15% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '340 30% 22%',
        'sidebar-primary': '340 70% 48%',
        'sidebar-accent': '320 50% 46%',
      },
      dark: {
        primary: '340 65% 62%',
        secondary: '320 48% 52%',
        surface: '340 10% 10%',
        text: '340 20% 90%',
        muted: '340 10% 18%',
        accent: '320 48% 52%',
        border: '340 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '340 10% 8%',
        'sidebar-foreground': '340 20% 80%',
        'sidebar-primary': '340 65% 62%',
        'sidebar-accent': '320 48% 52%',
      },
    },
  },

  // ─── 7. EMERALD (teals) ───
  {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      light: {
        primary: '165 75% 35%',
        secondary: '140 50% 44%',
        surface: '165 25% 97%',
        text: '165 30% 12%',
        muted: '165 15% 94%',
        accent: '140 50% 44%',
        border: '165 15% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '165 30% 22%',
        'sidebar-primary': '165 75% 35%',
        'sidebar-accent': '140 50% 44%',
      },
      dark: {
        primary: '165 65% 48%',
        secondary: '140 45% 44%',
        surface: '165 10% 10%',
        text: '165 20% 90%',
        muted: '165 10% 18%',
        accent: '140 45% 44%',
        border: '165 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '165 10% 8%',
        'sidebar-foreground': '165 20% 80%',
        'sidebar-primary': '165 65% 48%',
        'sidebar-accent': '140 45% 44%',
      },
    },
  },

  // ─── 8. AMBER (warm golden) ───
  {
    id: 'amber',
    name: 'Amber',
    colors: {
      light: {
        primary: '35 92% 42%',
        secondary: '15 80% 48%',
        surface: '35 30% 97%',
        text: '35 30% 10%',
        muted: '35 20% 93%',
        accent: '15 80% 48%',
        border: '35 20% 85%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '35 30% 20%',
        'sidebar-primary': '35 92% 42%',
        'sidebar-accent': '15 80% 48%',
      },
      dark: {
        primary: '35 85% 52%',
        secondary: '15 72% 52%',
        surface: '35 10% 10%',
        text: '35 20% 90%',
        muted: '35 10% 18%',
        accent: '15 72% 52%',
        border: '35 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '35 10% 8%',
        'sidebar-foreground': '35 20% 80%',
        'sidebar-primary': '35 85% 52%',
        'sidebar-accent': '15 72% 52%',
      },
    },
  },

  // ─── 9. VIOLET (deeper purple) ───
  {
    id: 'violet',
    name: 'Violet',
    colors: {
      light: {
        primary: '262 83% 52%',
        secondary: '290 55% 48%',
        surface: '260 25% 97%',
        text: '260 30% 12%',
        muted: '260 15% 94%',
        accent: '290 55% 48%',
        border: '260 15% 86%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '260 30% 22%',
        'sidebar-primary': '262 83% 52%',
        'sidebar-accent': '290 55% 48%',
      },
      dark: {
        primary: '262 75% 65%',
        secondary: '290 50% 55%',
        surface: '260 10% 10%',
        text: '260 20% 90%',
        muted: '260 10% 18%',
        accent: '290 50% 55%',
        border: '260 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '260 10% 8%',
        'sidebar-foreground': '260 20% 80%',
        'sidebar-primary': '262 75% 65%',
        'sidebar-accent': '290 50% 55%',
      },
    },
  },

  // ─── 10. SLATE (neutral grays) ───
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      light: {
        primary: '215 25% 27%',
        secondary: '215 20% 45%',
        surface: '220 20% 97%',
        text: '220 20% 12%',
        muted: '220 15% 93%',
        accent: '215 20% 45%',
        border: '220 15% 85%',
        destructive: '0 84.2% 60.2%',
        sidebar: '0 0% 98%',
        'sidebar-foreground': '220 20% 22%',
        'sidebar-primary': '215 25% 27%',
        'sidebar-accent': '215 20% 45%',
      },
      dark: {
        primary: '215 20% 62%',
        secondary: '215 18% 52%',
        surface: '220 10% 10%',
        text: '220 20% 90%',
        muted: '220 10% 18%',
        accent: '215 18% 52%',
        border: '220 10% 22%',
        destructive: '0 62.8% 50%',
        sidebar: '220 10% 8%',
        'sidebar-foreground': '220 20% 80%',
        'sidebar-primary': '215 20% 62%',
        'sidebar-accent': '215 18% 52%',
      },
    },
  },
];

/** Quick lookup: palette id → PaletteConfig */
export const PRESETS_MAP: Record<string, PaletteConfig> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
);

export const PALETTE_NAMES: Record<string, string> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p.name]),
);
