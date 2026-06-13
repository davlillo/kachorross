import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PRESETS_MAP } from './presets';
import {
  applyTheme,
  getDefaultPalette,
  getPersistedMode,
  persistMode,
  setHtmlDarkClass,
  PALETTE_NAMES,
} from './theme-utils';
import type { ThemeMode, PaletteConfig } from './types';

interface ThemeContextType {
  paletteId: string;
  mode: ThemeMode;
  setPalette: (id: string) => void;
  toggleMode: () => void;
  PALETTE_NAMES: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function useCurrentPalette(paletteId: string): PaletteConfig {
  return PRESETS_MAP[paletteId] ?? getDefaultPalette();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { veterinaria } = useAuth();

  const [mode, setMode] = useState<ThemeMode>(() => getPersistedMode());
  const [paletteId, setPaletteId] = useState<string>('purpura');
  const initializedRef = useRef(false);

  // Derive paletteId from veterinaria.tema
  const resolvedPaletteId = veterinaria?.tema?.paletteId ?? 'purpura';
  const palette = useCurrentPalette(resolvedPaletteId);

  // Sync paletteId when veterinaria changes (e.g., login/logout/swap clinic)
  useEffect(() => {
    setPaletteId(resolvedPaletteId);
  }, [resolvedPaletteId]);

  // Apply theme on palette or mode change
  useEffect(() => {
    applyTheme(palette, mode);
    setHtmlDarkClass(mode);
    persistMode(mode);
    initializedRef.current = true;
  }, [palette, mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setPalette = useCallback((id: string) => {
    if (PRESETS_MAP[id]) {
      setPaletteId(id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ paletteId, mode, setPalette, toggleMode, PALETTE_NAMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}
