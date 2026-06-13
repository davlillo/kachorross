import { PRESETS_MAP, PALETTE_NAMES } from './presets';
import type { PaletteConfig, ThemeMode, ThemeTokens } from './types';

export { PALETTE_NAMES };

const BRAND_PREFIX = '--brand-';

/** Maps ThemeTokens keys to CSS custom property names */
const TOKEN_MAP: Record<keyof ThemeTokens, string> = {
  primary: `${BRAND_PREFIX}primary`,
  secondary: `${BRAND_PREFIX}secondary`,
  surface: `${BRAND_PREFIX}surface`,
  text: `${BRAND_PREFIX}text`,
  muted: `${BRAND_PREFIX}muted`,
  accent: `${BRAND_PREFIX}accent`,
  border: `${BRAND_PREFIX}border`,
  destructive: `${BRAND_PREFIX}destructive`,
  sidebar: `${BRAND_PREFIX}sidebar`,
  'sidebar-foreground': `${BRAND_PREFIX}sidebar-foreground`,
  'sidebar-primary': `${BRAND_PREFIX}sidebar-primary`,
  'sidebar-accent': `${BRAND_PREFIX}sidebar-accent`,
};

/**
 * Inject brand CSS custom properties on :root.
 * Tokens are set as HSL space values (e.g. "270 75% 42%").
 */
export function applyTheme(palette: PaletteConfig, mode: ThemeMode): void {
  const tokens = palette.colors[mode];
  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens) as [keyof ThemeTokens, string][]) {
    const varName = TOKEN_MAP[key];
    if (varName) {
      root.style.setProperty(varName, value);
    }
  }
}

/**
 * Returns the default palette config (Púrpura).
 * Used when veterinaria.tema is null (REQ-6 backward compat).
 */
export function getDefaultPalette(): PaletteConfig {
  return PRESETS_MAP['purpura'];
}

/**
 * Read persisted mode from localStorage.
 * Falls back to 'light'.
 */
export function getPersistedMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('kachorros-theme-mode');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage may be unavailable
  }
  return 'light';
}

/**
 * Persist mode preference to localStorage.
 */
export function persistMode(mode: ThemeMode): void {
  try {
    localStorage.setItem('kachorros-theme-mode', mode);
  } catch {
    // silently ignore
  }
}

/**
 * Toggle dark class on <html> element.
 */
export function setHtmlDarkClass(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
