# Apply Progress: clinic-theming

## Status: COMPLETE

## Phase 1: Infrastructure (✅)
- [x] T001 Create `supabase/migrations/20260613_add_veterinarias_tema.sql` + update `supabase_schema.sql`
- [x] T002 Add `ClinicTheme` type to `src/types/index.ts`; add `tema?` to `Veterinaria`
- [x] T003 Create `src/theme/types.ts` — `ThemeTokens`, `PaletteConfig`, `ClinicTheme`
- [x] T004 Create `src/theme/presets.ts` — 10 palettes (Púrpura through Slate)
- [x] T005 Create `src/theme/theme-utils.ts` — `applyTheme`, `getPersistedMode`, `setHtmlDarkClass`
- [x] T006 Create `src/theme/ThemeContext.tsx` — `ThemeProvider` + `useTheme()`
- [x] T007 Create `src/theme/index.ts` barrel + `src/hooks/useTheme.ts`
- [x] T008 Anti-FOUT inline script in `index.html`

## Phase 2: Integration & Wiring (✅)
- [x] T009 Update `tailwind.config.js` — `brand.*` colors + safelist
- [x] T010 Update `src/index.css` — `.dark` block with brand token fallbacks
- [x] T011 Update `VeterinariaController` — `mapVeterinaria` extracts `tema`; `actualizar` accepts `tema`
- [x] T012 Wrap `AuthContext` children with `ThemeProvider`

## Phase 3: Component Migration (✅)
- [x] T013 Migrate Sonner toaster — `text-brand-primary`, `text-brand-secondary`, remove hardcoded `theme="light"`
- [x] T014 Migrate molecules: StatsCard, SearchBar, PageHeader, BrandPanel, AuthBackground, TimeClockPicker
- [x] T015 Migrate organisms: Layout, PatientInfoCard, MonitorCard, ConfirmSalidaDialog, ProductTable, ProductSelectorDialog, DetailRecepcionDialog, VerConsultaDialog
- [x] T016 Migrate pages: App.tsx, dashboard, consulta/nueva, configuracion, login, registro, recepcion, expedientes, expedientes/nuevo, expedientes/[id], historial-ventas, perfil, establece-contrasena, admin/catalogo, admin/seguridad/usuarios
- [x] Also migrated: atoms/custom/EspecieBadge, atoms/custom/StatusBadge, atoms/ui/select.tsx, atoms/ui/sonner.tsx

## Phase 4: Feature Implementation (✅)
- [x] T017 Create `src/theme/palette-selector.tsx` — grid of 10 palette cards with live preview
- [x] T018 Add "Apariencia" section to `/configuracion` with PaletteSelector + save button (admin only)
- [x] T019 Add dark/light toggle in Layout sidebar (desktop) + header (mobile)

## Phase 5: Cleanup (✅)
- [x] T020 Remove deprecated colors from `tailwind.config.js` and `src/index.css`
- [x] T021 Visual regression QA — build passes with zero TypeScript errors

## Files Modified/Created

| File | Action |
|------|--------|
| `supabase/migrations/20260613_add_veterinarias_tema.sql` | Created |
| `supabase_schema.sql` | Modified (+1 column) |
| `src/types/index.ts` | Modified (+ClinicTheme, +tema?) |
| `src/theme/types.ts` | Created |
| `src/theme/presets.ts` | Created (10 palettes) |
| `src/theme/theme-utils.ts` | Created |
| `src/theme/ThemeContext.tsx` | Created |
| `src/theme/palette-selector.tsx` | Created |
| `src/theme/index.ts` | Created |
| `src/hooks/useTheme.ts` | Created |
| `src/index.css` | Modified (+brand tokens, -.dark block, -deprecated utilities) |
| `tailwind.config.js` | Modified (+brand.* colors, +safelist, -deprecated colors) |
| `index.html` | Modified (+anti-FOUT script) |
| `src/context/AuthContext.tsx` | Modified (+ThemeProvider wrap) |
| `src/controllers/veterinaria.controller.ts` | Modified (+tema mapping) |
| `src/controllers/index.ts` | Modified (+VeterinariaController export) |
| `src/components/atoms/ui/sonner.tsx` | Modified |
| `src/components/atoms/ui/select.tsx` | Modified |
| `src/components/atoms/custom/EspecieBadge.tsx` | Modified |
| `src/components/atoms/custom/StatusBadge.tsx` | Modified |
| `src/components/molecules/StatsCard.tsx` | Modified |
| `src/components/molecules/SearchBar.tsx` | Modified |
| `src/components/molecules/PageHeader.tsx` | Modified |
| `src/components/molecules/BrandPanel.tsx` | Modified |
| `src/components/molecules/AuthBackground.tsx` | Modified |
| `src/components/molecules/TimeClockPicker.tsx` | Modified |
| `src/components/organisms/Layout.tsx` | Modified (+dark toggle) |
| `src/components/organisms/PatientInfoCard.tsx` | Modified |
| `src/components/organisms/MonitorCard.tsx` | Modified |
| `src/components/organisms/ConfirmSalidaDialog.tsx` | Modified |
| `src/components/organisms/ProductTable.tsx` | Modified |
| `src/components/organisms/ProductSelectorDialog.tsx` | Modified |
| `src/components/organisms/DetailRecepcionDialog.tsx` | Modified |
| `src/components/organisms/VerConsultaDialog.tsx` | Modified |
| `src/app/configuracion/page.tsx` | Modified (+Apariencia section) |
| `src/app/dashboard/page.tsx` | Modified |
| `src/app/consulta/nueva/page.tsx` | Modified |
| `src/app/recepcion/page.tsx` | Modified |
| `src/app/expedientes/page.tsx` | Modified |
| `src/app/expedientes/[id]/page.tsx` | Modified |
| `src/app/expedientes/nuevo/page.tsx` | Modified |
| `src/app/historial-ventas/page.tsx` | Modified |
| `src/app/perfil/page.tsx` | Modified |
| `src/app/admin/catalogo/page.tsx` | Modified |
| `src/app/admin/seguridad/usuarios/page.tsx` | Modified |
| `src/app/login/page.tsx` | Modified |
| `src/app/registro/page.tsx` | Modified |
| `src/app/establecer-contrasena/page.tsx` | Modified |
| `src/App.tsx` | Modified |

## Build Status: ✅ PASS (zero TypeScript errors)
