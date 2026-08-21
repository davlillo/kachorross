# Proposal: consultas-fixes

## Intent

Three low-risk fixes in the consulta/recepción workflow:

1. **Double-save guard**: The "Guardar Consulta" button lacks async re-entrancy protection. Rapid clicks during a slow network create duplicate consultas in Supabase, corrupting billing data.

2. **Manual de Usuario removal**: Remove interactive tutorial system (unused) — its components, data, screenshots, scripts, and openspec artifacts create dead maintenance surface.

3. **Prefactura field completeness**: The `DetailRecepcionDialog` omits `Producto.descripcion` and mislabels the nombre column as "Descripción", forcing staff to open the catalog for product context.

## Scope

### In Scope
- Add `isSaving` guard + disable button during async save in consulta form
- Delete all manual-usuario source: 1 page, 4 molecules (Hotspot, SessionList, StepNavigator, TutorialSession), 1 content file
- Delete 7 manual screenshots from `public/screenshots/`, 2 capture scripts
- Delete manual-usuario openspec artifacts (spec + active change + archived change)
- Remove manual route (`App.tsx`), nav item (`Layout.tsx`), barrel exports (`molecules/index.ts`), 3 type interfaces (`types/index.ts`)
- Clean `tailwind.config.js` manual-only keyframes (`hotspot-pop`, `step-enter`)
- Add descripción column, rename "Descripción" → "Nombre" header in prefactura grid

### Out of Scope
- Form validation overhaul
- Controller-level deduplication logic
- Any other consulta/recepción changes

## Capabilities

### New Capabilities
- `double-save-guard`: Guard consulta creation against duplicate submissions via async state tracking

### Modified Capabilities
- `manual-usuario`: REMOVED — capability and all its artifacts deleted
- `prefactura-detail`: ADDED `descripcion` field display; corrected nombre column header

## Approach

1. **Double-save**: Add `isSaving` state → guard `handleSubmit` with early return → disable button with `disabled={!isValid || isSaving}`. Single file, zero architectural impact.

2. **Manual cleanup**: Delete files by category (page → molecules → data → types → screenshots → openspec → scripts) then edit references. All deletions safe — no shared imports from manual components.

3. **Prefactura**: Add 1 header column + 1 data cell. Adjust `grid-cols-12` span allocations. Rename header text.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/consulta/nueva/page.tsx` | Modified | Add isSaving guard |
| `src/app/manual/page.tsx` | Removed | Page component |
| `src/data/manual-content.ts` | Removed | Content data |
| `src/components/molecules/Hotspot.tsx` | Removed | Manual-only |
| `src/components/molecules/SessionList.tsx` | Removed | Manual-only |
| `src/components/molecules/StepNavigator.tsx` | Removed | Manual-only |
| `src/components/molecules/TutorialSession.tsx` | Removed | Manual-only |
| `src/components/molecules/index.ts` | Modified | Remove 4 exports |
| `src/components/organisms/DetailRecepcionDialog.tsx` | Modified | Add descripción, fix header |
| `src/types/index.ts` | Modified | Remove HotspotDef, TutorialStep, ManualSession |
| `src/App.tsx` | Modified | Remove /manual route + import |
| `src/components/organisms/Layout.tsx` | Modified | Remove nav item + BookOpen icon import |
| `tailwind.config.js` | Modified | Remove hotspot-pop, step-enter keyframes/animations |
| `public/screenshots/` | Modified | Delete 7 PNGs |
| `scripts/` | Modified | Delete capture_manual_screenshots.py, generate_placeholder_screenshots.py |
| `openspec/specs/manual-usuario/` | Removed | Capability spec |
| `openspec/changes/manual-usuario-interactivo/` | Removed | Active change |
| `openspec/changes/archive/2026-06-14-manual-usuario-interactivo/` | Removed | Archived change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missed import causing build failure after manual deletion | Low | Grep for all manual-related identifiers before deleting; tsc -b confirms zero refs |
| Prefactura grid layout breaks on narrow viewports with extra column | Low | Test with 3+ products; existing responsive grid absorbs extra column |

## Rollback Plan

`git revert` — all changes within a single commit. No data migration, no schema changes.

## Dependencies

None.

## Success Criteria

- [ ] Double-click "Guardar Consulta" creates exactly one consulta
- [ ] Zero `ManualSession`, `HotspotDef`, `TutorialStep`, `SessionList` references remain in `src/`
- [ ] `npm run lint` and `tsc -b` pass clean
- [ ] Prefactura dialog shows código, nombre, descripción, cantidad, precio, subtotal per row
- [ ] Column header reads "Nombre" (not "Descripción")
