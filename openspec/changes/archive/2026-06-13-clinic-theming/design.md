# Design: Customizable Clinic Color Palettes

## Technical Approach

CSS Custom Properties over a React ThemeProvider. Per-clinic palette persisted as JSONB (`veterinarias.tema`). Palette defines HSL tokens; ThemeProvider injects them into `document.documentElement.style`. Tailwind `theme.extend.colors.brand.*` maps CSS variable references so `bg-brand-primary` resolves at runtime. Mode (light/dark) is session-only (localStorage), NOT database — palette provides both variants.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS injection | `document.documentElement.style.setProperty` in useEffect | Avoids CSS-in-JS runtime cost; one write to `:root` updates all consumers. Tailwind utilities resolve the HSL values natively |
| Mode persistence | localStorage key `kachorros-theme-mode` | Per-user, per-browser session; no DB schema change. Mode toggles `dark` class on `<html>`, triggering Tailwind's `darkMode:"class"` |
| Palette in DB vs auth JWT | DB column `tema JSONB` | Real-time sync across admins on same clinic; survives token refresh; simpler authorization |
| Brand token naming | `brand-primary`, `brand-secondary`, `brand-surface`, `brand-muted`, `brand-accent`, `brand-border`, `brand-destructive`, `brand-sidebar-*` | Mirrors shadcn/ui semantic token pattern; minimal cognitive load for devs already familiar with `--primary`, `--secondary` |
| Tailwind safelist | Regex pattern `bg-brand-*`, `text-brand-*`, `border-brand-*`, `ring-brand-*`, `from-brand-*`, `to-brand-*` | Prevents purge of dynamically composed classes without bloating safelist |
| FOUT prevention | Inline `<script>` in `index.html <head>` reading `localStorage` and injecting default palette (Púrpura) CSS vars before React hydrates | Zero-latency first paint; avoids flash of unstyled content |

## Data Flow

```
veterinarias.tema (JSONB) ──→ AuthProvider.loadVeterinaria()
                                       │
                                veterinarian.tema
                                       │
                                       ▼
                     ThemeProvider reads paletteId
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         presets[paletteId]          localStorage mode
         (src/theme/presets.ts)      ('light' | 'dark')
                │                           │
                └──────────┬────────────────┘
                           ▼
              applyTheme(palette, mode)
                           │
              document.documentElement
              .style.setProperty('--brand-primary', value)
                           │
                           ▼
              Tailwind brand-* classes resolve
                           │
                           ▼
              All components re-render with new colors
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/theme/types.ts` | Create | `PaletteConfig`, `ThemeTokens`, `ClinicTheme` types |
| `src/theme/presets.ts` | Create | 10 palette definitions, each with `light`/`dark` tokens |
| `src/theme/theme-utils.ts` | Create | `applyTheme(palette, mode)`, `getInitialPalette()`, `PALETTE_NAMES` |
| `src/theme/ThemeContext.tsx` | Create | `ThemeProvider` + `useTheme()` hook |
| `src/theme/palette-selector.tsx` | Create | Grid swatch picker component |
| `src/theme/index.ts` | Create | Barrel export |
| `src/hooks/useTheme.ts` | Create | Convenience re-export from ThemeContext |
| `src/types/index.ts` | Modify | Add `ClinicTheme` type, `tema?` to `Veterinaria` |
| `src/context/AuthContext.tsx` | Modify | Wrap children with `ThemeProvider` |
| `src/controllers/veterinaria.controller.ts` | Modify | `mapVeterinaria` extracts `tema`; `actualizar` maps `tema` field |
| `src/controllers/index.ts` | Modify | Export `VeterinariaController` (missing from barrel) |
| `src/index.css` | Modify | Add `.dark` block; replace hardcoded brand HSL with `--brand-*` refs; remove `text-purpura-*`/`bg-purpura-*` utility classes |
| `tailwind.config.js` | Modify | Add `brand.*` colors using HSL var refs; safelist for `brand-*`; deprecate `purpura`, `amber-gold`, `neon-pink`, `blue-violet`, `azure-blue`, `sky-light`, `blaze-orange` |
| `src/components/atoms/ui/sonner.tsx` | Modify | Replace hardcoded `text-purpura-*`, `bg-purpura-*` with `text-brand-primary`, `bg-brand-primary` |
| `src/app/configuracion/page.tsx` | Modify | Add "Apariencia" section with `PaletteSelector` |
| `index.html` | Modify | Add inline `<script>` for anti-FOUT CSS var injection |
| `supabase/migrations/20260613_add_veterinarias_tema.sql` | Create | `ALTER TABLE veterinarias ADD COLUMN tema JSONB DEFAULT NULL` |
| `supabase_schema.sql` | Modify | Add `tema` column to `veterinarias` CREATE TABLE |
| ~30 files in `app/`, `components/` | Modify | Replace hardcoded color classes with `brand-*` tokens |

## Palette Data Model

```typescript
// src/theme/types.ts
type ThemeTokens = {
  primary: string;       // HSL "270 75% 42%"
  secondary: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  destructive: string;
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-accent': string;
};

type PaletteConfig = {
  id: string;
  name: string;
  colors: { light: ThemeTokens; dark: ThemeTokens };
};

// veterinarias.tema JSONB
type ClinicTheme = {
  paletteId: string;
  updatedAt: string; // ISO timestamp
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `applyTheme()` sets correct CSS vars | Jest + jsdom `document.documentElement.style` inspection |
| Unit | All 10 presets parse correctly | Snapshot test on `presets.ts` |
| Integration | ThemeProvider reads `veterinaria.tema` and injects vars | Mount with mocked AuthContext, assert CSS custom properties |
| Integration | Palette selector persists via `VeterinariaController.actualizar` | Simulate click, spy on controller |
| Visual | No broken layout on Dashboard, Expedientes, Recepcion, Catálogo | Manual QA per page after migration |

## Migration / Rollout

**No downtime required.** Column is nullable; existing clinics get `tema: null` → defaults to Púrpura (current brand). Migration steps:

1. Run migration SQL → DB ready
2. Deploy `ThemeProvider` + types (reads `tema`, falls back to Púrpura)
3. Deploy Tailwind config changes (brand tokens co-exist with old `purpura-*`)
4. Migrate components file by file: Sonner → molecules → organisms → pages
5. Deploy "Apariencia" UI in config page
6. Remove old `purpura`/`amber-gold`/etc. from Tailwind config and `index.css` (phase 3, post-verification)

**Rollback**: Remove `ThemeProvider` wrapper, restore old Tailwind config colors. `DROP COLUMN IF EXISTS tema` is safe (nullable).

## Open Questions

- [ ] Should `super_admin` be able to set per-clinic theme from super-admin panel? (Out of scope for v1)
- [ ] Do we need a "reset to default" button in case palette config gets corrupted? (Add as safety measure)
