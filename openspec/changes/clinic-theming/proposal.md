# Proposal: Customizable Clinic Color Palettes

## Intent

Kachorross is multi-tenant but every clinic looks identical — same purple brand everywhere. Vet clinics have distinct physical identities; the software should mirror that. Adding per-clinic theming transforms a generic SaaS into a branded experience, reduces onboarding friction for clinics with established visual identities, and lays the foundation for dark mode (already configured but unimplemented).

## Scope

### In Scope
- **ThemeProvider + ThemeContext** — reads `veterinaria.tema` from DB, injects CSS custom properties into `<html>` at runtime
- **10 preset palettes** — each with light + dark variants defined as JSON configs
- **Per-clinic theme persistence** — `ALTER TABLE veterinarias ADD COLUMN tema JSONB`; `VeterinariaController.actualizar()` handles it
- **Dark/light mode toggle** — per-user session preference, per-palette token sets
- **CSS variable tokenization** — migrate all 150+ hardcoded classes (`text-purpura-*`, `bg-amber-*`, `text-blue-violet`, etc.) to semantic brand tokens (`--brand-primary`, `--brand-secondary`, `--brand-surface`, `--brand-muted`)
- **Config page UI** — "Apariencia" section in `/configuracion` with palette grid selector + live preview + dark/light toggle
- **Sonner toaster theming** — replace static colors with CSS variable references
- **Tailwind safelist** — prevent purge of dynamic brand classes

### Out of Scope
- Custom color picker (presets only for v1)
- Theme marketplace / sharing
- Per-user themes (clinic-level only)
- Per-page overrides (one theme per clinic)

## Capabilities

### New Capabilities
- `clinic-theming`: ThemeProvider architecture, 10 preset palettes (light+dark), CSS variable injection, palette selector UI, and Sonner integration

### Modified Capabilities
- None (no existing spec capabilities to modify)

## Approach

**CSS Custom Properties + React ThemeProvider** (Approach A from exploration).

1. **Schema**: `ALTER TABLE veterinarias ADD COLUMN tema JSONB DEFAULT NULL` — nullable, backward-compatible
2. **Type**: Add `tema?: ClinicTheme` to `Veterinaria` interface. `ClinicTheme = { preset: string; mode: 'light' | 'dark' }`
3. **ThemeProvider**: Wraps `<html style={cssVars}>` — reads `veterinaria.tema` from `useAuth()`, maps preset name to token set, injects HSL variables. Cached in context.
4. **10 Presets**: Defined in `src/lib/themes.ts` as `Record<string, ThemeTokens>` with `light`/`dark` variants for `--brand-primary`, `--brand-secondary`, `--brand-surface`, `--brand-muted`, `--brand-accent`, `--brand-border`
5. **Migration Strategy**: Phase 1—tokenize old color classes in `tailwind.config.js` as aliases. Phase 2—replace 150+ hardcoded usages across `app/`, `components/`, `context/`. Phase 3—remove old `purpura`, `amber-gold` etc. from config.
6. **Dark Mode**: `ThemeProvider` sets `dark` class on `<html>`, Tailwind `darkMode: "class"` picks up `.dark` block from `index.css`. Each palette defines dark tokens — desaturated, higher-luminosity variants.
7. **Config Page**: Palette grid (10 cards with color swatches), hover preview, "Guardar" persists via `VeterinariaController.actualizar(id, { tema })`

## Preset Palettes

| # | Name | Primary | Surface | Accent | Vibe |
|---|------|---------|---------|--------|------|
| 1 | **Púrpura** | `270 75% 42%` | `270 25% 98%` | `45 100% 52%` | Current brand (default) |
| 2 | **Ocean** | `195 70% 42%` | `195 20% 97%` | `15 80% 55%` | Cool, clinical |
| 3 | **Forest** | `150 35% 35%` | `150 20% 96%` | `35 85% 50%` | Natural, holistic |
| 4 | **Sunset** | `15 80% 50%` | `20 30% 97%` | `280 50% 45%` | Warm, energetic |
| 5 | **Rose** | `340 50% 50%` | `340 10% 96%` | `220 15% 55%` | Soft, compassionate |
| 6 | **Midnight** | `220 60% 30%` | `220 10% 96%` | `200 80% 55%` | Professional, serious |
| 7 | **Mint** | `160 45% 45%` | `160 20% 97%` | `25 75% 60%` | Fresh, clean |
| 8 | **Sahara** | `30 35% 40%` | `30 20% 95%` | `15 45% 45%` | Earthy, warm |
| 9 | **Berry** | `330 60% 35%` | `330 10% 97%` | `42 80% 50%` | Rich, elegant |
| 10 | **Slate** | `215 20% 40%` | `215 10% 97%` | `262 60% 55%` | Minimal, urban |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase_schema.sql` | Modified | `ALTER TABLE veterinarias ADD COLUMN tema JSONB` |
| `src/types/index.ts` | Modified | Add `ClinicTheme` type, add `tema?` to `Veterinaria` |
| `src/controllers/veterinaria.controller.ts` | Modified | `mapVeterinaria()`, `actualizar()` handle tema field |
| `src/context/AuthContext.tsx` | Modified | Wrap with ThemeProvider |
| `src/context/ThemeContext.tsx` | New | ThemeProvider + useTheme hook |
| `src/lib/themes.ts` | New | 10 presets, token mapping |
| `src/index.css` | Modified | Add `.dark` block, deprecate brand hardcodes |
| `tailwind.config.js` | Modified | Replace hardcoded colors with CSS variable refs, add safelist |
| `src/components/atoms/ui/sonner.tsx` | Modified | Use CSS variables for toast colors |
| `src/app/configuracion/page.tsx` | Modified | Add "Apariencia" section |
| `src/components/molecules/` | Modified | ~20 files — replace hardcoded color classes |
| `src/components/organisms/` | Modified | ~8 files — same |
| `src/app/*/page.tsx` | Modified | ~12 files — same |
| `openspec/changes/clinic-theming/` | New | SDD artifacts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Visual regression from 150+ class replacements | High | Audit via grep before/after snapshots, phase migration, manual QA per page |
| Tailwind purges dynamic brand classes | Medium | Safelist `brand-*` pattern in `tailwind.config.js` |
| DB migration fails in production | Low | Nullable column, no default, backward-compatible reads |
| Sonner theme locks to wrong mode on SSR | Low | Use `useTheme()` in client component; Sonner already client-side |
| Theme flicker on initial load | Medium | Inject default theme vars in `index.html <head>` before React hydrates |

## Rollback Plan

1. Remove `tema` column handling from `VeterinariaController.actualizar()` (or keep — nullable is harmless)
2. Restore hardcoded color classes in `tailwind.config.js` (keep as aliases during migration, not removed until verified)
3. Revert `src/index.css` to pre-theming state
4. Remove `ThemeContext` from `AuthContext.tsx` wrapper
5. Database: `ALTER TABLE veterinarias DROP COLUMN IF EXISTS tema` — safe because column was nullable

## Dependencies

- None external. All tooling already in project (Tailwind `darkMode: "class"`, shadcn/ui CSS vars, Supabase JSONB support).

## Success Criteria

- [ ] Admin selects a palette in /configuracion → all clinic UI updates without page reload
- [ ] Dark/light toggle works per session, persists across navigation
- [ ] All 10 presets render without visual breakage on Dashboard, Expedientes, Recepcion, and Catálogo pages
- [ ] Zero hardcoded `purpura-*`, `amber-gold`, `neon-pink`, `blue-violet`, `azure-blue`, `sky-light` remain in JSX
- [ ] Sonner toasts reflect active palette colors in both modes
- [ ] `tsc -b` passes with no new type errors
- [ ] `npm run lint` passes
