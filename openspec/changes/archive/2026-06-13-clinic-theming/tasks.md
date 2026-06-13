# Tasks: Customizable Clinic Color Palettes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1050 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk (ask-always) |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: DB, types, presets, ThemeProvider, anti-FOUT — no visual change | PR 1 | ~583 lines; ~380 are declarative preset configs in `presets.ts` |
| 2 | Integration: Tailwind config, CSS migration, controller wiring, component migration | PR 2 | ~285 lines; depends on PR 1 |
| 3 | Feature UI + Cleanup: palette selector, config page, dark toggle, old color removal | PR 3 | ~180 lines; depends on PR 2 |

## Phase 1: Infrastructure (no visual change)

- [ ] T001 Create `supabase/migrations/20260613_add_veterinarias_tema.sql` — `ALTER TABLE veterinarias ADD COLUMN tema JSONB DEFAULT NULL`; update `supabase_schema.sql` CREATE TABLE. **(+5 lines, no deps)**
- [ ] T002 Add `ClinicTheme = { paletteId: string; updatedAt?: string }` to `src/types/index.ts`; add `tema?: ClinicTheme` to `Veterinaria`. **(+15, T001)**
- [ ] T003 Create `src/theme/types.ts` — `ThemeTokens`, `PaletteConfig`, `ClinicTheme` (mirrored from domain types). **(+35, T002)**
- [ ] T004 Create `src/theme/presets.ts` — 10 palettes (Púrpura through Slate), each with 12+ tokens in `light`/`dark`. Púrpura values MUST match current `:root` HSL. **(+380, T003)**
- [ ] T005 Create `src/theme/theme-utils.ts` — `applyTheme(palette, mode)` sets CSS vars on `documentElement.style`; `getInitialPalette()`; `PALETTE_NAMES` map. **(+50, T004)**
- [ ] T006 Create `src/theme/ThemeContext.tsx` — `ThemeProvider` reads `veterinaria.tema` from `useAuth()`, calls `applyTheme`, toggles `dark` class on `<html>`; `useTheme()` hook returns `{ paletteId, mode, setPalette, toggleMode }`. **(+75, T005)**
- [ ] T007 Create `src/theme/index.ts` barrel + `src/hooks/useTheme.ts` re-export. **(+8, T006)**
- [ ] T008 Add anti-FOUT inline `<script>` in `index.html <head>` — reads `localStorage` mode, injects Púrpura light CSS vars before React hydrates. **(+15, T004)**

## Phase 2: Integration & Wiring

- [ ] T009 Update `tailwind.config.js` — extend colors with `brand.*` using `hsl(var(--brand-*))` refs; safelist regex for `bg-brand-*`, `text-brand-*`, `border-brand-*`, `ring-brand-*`, `from-brand-*`, `to-brand-*`. Keep old colors as deprecated aliases. **(+30, T008)**
- [ ] T010 Migrate `src/index.css` — add `.dark` block with brand token overrides; keep shadcn/ui tokens unchanged; keep old brand utilities (remove later). **(+40, T009)**
- [ ] T011 Update `VeterinariaController.mapVeterinaria()` to extract `tema`; `actualizar()` to accept/map `tema`. Update `src/controllers/index.ts` barrel. **(+25, T002)**
- [ ] T012 Wrap protected route tree with `ThemeProvider` in `AuthContext.tsx`, reading `veterinaria.tema`; reset theme on logout. **(+10, T006, T011)**

## Phase 3: Component Migration (color class replacement)

- [ ] T013 Replace hardcoded colors in `src/components/atoms/ui/sonner.tsx` — `text-purpura-*`, `bg-purpura-*`, `border-purpura-*` → `text-brand-primary`, `bg-brand-primary`, `border-brand-primary`; Sonner `theme` prop → `"system"`. **(±20, T012)**
- [ ] T014 Migrate `src/components/molecules/*.tsx` (~20 files: StatsCard, SearchBar, MobileSidebar, etc.) — replace all hardcoded brand colors with `brand-*` classes. **(±80, T010)**
- [ ] T015 Migrate `src/components/organisms/*.tsx` (~8 files: Layout, Sidebar, HeaderBar, etc.) — same replacement. **(±32, T014)**
- [ ] T016 Migrate `src/app/*/page.tsx` (~12 files: dashboard, consultas, recepcion, expedientes, catalogo, historial, configuracion, super-admin) — same replacement. **(±48, T015)**

## Phase 4: Feature Implementation

- [ ] T017 Create `src/theme/palette-selector.tsx` — 3-column grid of 10 palette cards with color swatches; hover triggers live preview via `useTheme().setPalette(id)`; selected card shows check indicator. **(+100, T006)**
- [ ] T018 Add "Apariencia" section to `/configuracion` with `PaletteSelector` + "Guardar" button calling `VeterinariaController.actualizar(id, { tema })` + sonner success toast; admin-only guard. **(+50, T017, T011)**
- [ ] T019 Add dark/light toggle button in Sidebar (desktop) + HeaderBar (mobile) using `useTheme().toggleMode()`; persist `kachorros-theme-mode` in `localStorage`. **(+25, T012, T015)**

## Phase 5: Cleanup

- [ ] T020 Remove deprecated `purpura`, `amber-gold`, `neon-pink`, `blue-violet`, `azure-blue`, `sky-light`, `blaze-orange` from `tailwind.config.js` and `src/index.css`. **(−80/+5, T016, T018)**
- [ ] T021 Visual regression QA — audit 8 pages with Púrpura default; smoke test all 10 presets on Dashboard, Expedientes, Recepción, Catálogo. **(0 lines, T020)**
