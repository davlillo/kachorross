/**
 * Theme system types for clinic-level color palette customization.
 * Brand tokens are injected as CSS custom properties on :root
 * and consumed by Tailwind brand-* utility classes.
 */

/** HSL color value stored as "H S% L%" (e.g. "270 75% 42%") */
type HSL = string;

export interface ThemeTokens {
  primary: HSL;
  secondary: HSL;
  surface: HSL;
  text: HSL;
  muted: HSL;
  accent: HSL;
  border: HSL;
  destructive: HSL;
  sidebar: HSL;
  'sidebar-foreground': HSL;
  'sidebar-primary': HSL;
  'sidebar-accent': HSL;
}

export interface PaletteConfig {
  id: string;
  name: string;
  colors: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
}

export type ThemeMode = 'light' | 'dark';

/**
 * Mirrors src/types/index.ts ClinicTheme.
 * paletteId matches a PaletteConfig.id.
 */
export type ClinicTheme = {
  paletteId: string;
  updatedAt?: string;
};
