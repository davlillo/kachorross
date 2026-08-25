# Tasks: consultas-fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,270 (27 feature + 90 edits + 1,153 deletions) |
| 800-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Group A ~7 lines) → PR 2 (Group C ~20 lines) → PR 3 (Group B ~1,240 lines) |
| Delivery strategy | auto-forecast (C4) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

**Note:** PR 3 is ~1,240 lines but 100% deletions (dead code + binary assets). Review is mechanical grep verification, not logic review. May qualify for `size:exception` if reviewer consents.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Double-save guard on NuevaConsultaPage | PR 1 (~7 lines) | Independent, single-file change |
| 2 | Prefactura description column | PR 2 (~20 lines) | Independent, single-file change |
| 3 | Remove manual de usuario feature | PR 3 (~1,240 lines) | 22 file deletions + 5 file edits; all dead code |

## Phase 1: Double-Save Guard (Group A)

- [x] 1.1 In `src/app/consulta/nueva/page.tsx`, add `const [isSaving, setIsSaving] = useState(false)` after line 63
- [x] 1.2 In same file, guard `handleSubmit`: add `if (isSaving) return;` as first line, `setIsSaving(true);` after validation, `setIsSaving(false);` in catch block
- [x] 1.3 In same file, change button `disabled={!isValid}` to `disabled={!isValid || isSaving}` and add loading text (`isSaving ? "Guardando..." : "Guardar Consulta"`) with Loader2 spinner icon

## Phase 2: Prefactura Detail Column (Group C)

- [x] 2.1 In `src/components/organisms/DetailRecepcionDialog.tsx`, rename header "Descripción" (line 230) to "Nombre"
- [x] 2.2 In same file, add "Descripción" header `<div className="col-span-3">Descripción</div>` between Nombre and Cant. headers
- [x] 2.3 In same file, adjust grid spans — header row: Código:2, Nombre:2, Descripción:3, Cant.:1, P.Unit.:2, Sub.:2
- [x] 2.4 In same file, adjust body row spans: Código col-span-3→2, Nombre col-span-4→2, add Descripción cell (`detalle.producto.descripcion || "—"` with truncate, col-span-3), Cant. col-span-2→1, Sub. col-span-1→2

## Phase 3: Manual de Usuario Removal (Group B) — Deletions

- [x] 3.1 Delete source files: `src/app/manual/page.tsx`, `src/data/manual-content.ts`, `src/components/molecules/Hotspot.tsx`, `src/components/molecules/SessionList.tsx`, `src/components/molecules/StepNavigator.tsx`, `src/components/molecules/TutorialSession.tsx`
- [x] 3.2 Delete scripts: `scripts/capture_manual_screenshots.py`, `scripts/generate_placeholder_screenshots.py`
- [x] 3.3 Delete `public/screenshots/` directory (7 PNG files)
- [x] 3.4 Delete `openspec/specs/manual-usuario/spec.md`
- [x] 3.5 Delete `openspec/changes/manual-usuario-interactivo/` directory (5 files)
- [x] 3.6 Delete `openspec/changes/archive/2026-06-14-manual-usuario-interactivo/` directory (7+ files)

## Phase 4: Manual de Usuario Removal (Group B) — Reference Edits

- [x] 4.1 In `src/types/index.ts`, remove lines 208–237 (HotspotDef, TutorialStep, ManualSession interfaces + section comment)
- [x] 4.2 In `src/components/molecules/index.ts`, remove lines 10–13 (Hotspot, StepNavigator, TutorialSession, SessionList exports)
- [x] 4.3 In `src/App.tsx`, remove `import ManualPage` (line 37) and `/manual` route block (lines 289–293)
- [x] 4.4 In `src/components/organisms/Layout.tsx`, remove `BookOpen` from lucide import (line 33) and "Manual de Usuario" navItem (lines 83–88)
- [x] 4.5 In `tailwind.config.js`, remove `hotspot-pop` and `step-enter` keyframe blocks (lines 95–103) and their animation entries (lines 109–110)

## Phase 5: Verification

- [x] 5.1 Run `npx tsc -b --noEmit` — zero type errors
- [x] 5.2 Run `npm run lint` — no new lint errors (repo has pre-existing ESLint errors unrelated to this change)
- [x] 5.3 Grep for orphaned references: `manual`, `Hotspot`, `TutorialSession`, `SessionList`, `ManualSession`, `HotspotDef`, `manual-content` across `src/`
