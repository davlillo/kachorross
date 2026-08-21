# Design: consultas-fixes

## Technical Approach

Three independent, low-risk changes in the consulta/recepción workflow. All changes are confined to the page/component layer — zero controller or hook modifications. Each change touches isolated files with no cross-dependency.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| isSaving guard location | `useState` in `NuevaConsultaPage` | Controller-level deduplication, React ref | Easiest option for single-page UI guard. Controller-level dedup is a future concern for Supabase RLS/constraints. React ref doesn't provide the render-trigger needed for button disabled state. |
| Grid column allocation | 2-2-3-1-2-2 (código, nombre, desc, cant, p.unit, subtotal) | 2-2-2-2-2-2 (equal), 3-2-3-1-2-1 (keep 3 for código) | Prioritizes descripción readability (span-3) while código maintains prominence. Equal widths would waste space on cantidad (single digit). The original código span-3 is reduced to make room. |
| Deletion order | Delete files first, then edit references | Edit references first, then delete files | Build will temporarily break between delete and edit — acceptable since this happens within a single commit. Grep verification before commit ensures no orphaned references. |
| Error state for isSaving | Reset to `false` in catch block | Keep `true` (permanent lock) | Re-enabling the button on error allows retry. Users need to correct the issue and re-submit. |

## Data Flow

No controller/hook changes. All state is local component state.

```
Spec 1 — Double-Save Guard:
  NuevaConsultaPage
    isSaving (useState)
      ├── handleSubmit → guard: if (isSaving) return; setIsSaving(true)
      │     ├── success → navigate('/recepcion') → component unmounts
      │     └── error   → setIsSaving(false) + toast
      └── Button disabled={!isValid || isSaving}

Spec 2 — Manual Removal:
  No data flow. Pure deletion of unused dead code.
  Delete order: 21 files → edit 5 files.
  Dependencies: manual-content.ts imports ManualSession from types.
                App.tsx imports ManualPage.
                Layout.tsx imports BookOpen.

Spec 3 — Prefactura Detail:
  DetailRecepcionDialog
    consulta.detalles[].producto.descripcion  (already in memory, no fetch)
      → new <div> column in grid body
      → new <div> header labeled "Descripción"
      → existing column header renamed "Descripción" → "Nombre"
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/consulta/nueva/page.tsx` | Modify | Add `isSaving` state, guard handleSubmit, update button disabled prop |
| `src/components/organisms/DetailRecepcionDialog.tsx` | Modify | Add descripción column (header + body), rename "Descripción" → "Nombre" header, adjust grid spans |
| `src/types/index.ts` | Modify | Remove lines 208-237 (HotspotDef, TutorialStep, ManualSession interfaces) |
| `src/components/molecules/index.ts` | Modify | Remove lines 10-13 (Hotspot, StepNavigator, TutorialSession, SessionList exports) |
| `src/App.tsx` | Modify | Remove line 37 (import ManualPage), remove lines 289-293 (manual route) |
| `src/components/organisms/Layout.tsx` | Modify | Remove line 33 (BookOpen import), remove navItem lines 83-88 |
| `tailwind.config.js` | Modify | Remove hotspot-pop (lines 95-99) and step-enter (lines 100-103) keyframes, remove animation entries (lines 109-110) |
| `src/app/manual/page.tsx` | Delete | Manual page component |
| `src/data/manual-content.ts` | Delete | Manual session content data |
| `src/components/molecules/Hotspot.tsx` | Delete | Manual-only molecule |
| `src/components/molecules/SessionList.tsx` | Delete | Manual-only molecule |
| `src/components/molecules/StepNavigator.tsx` | Delete | Manual-only molecule |
| `src/components/molecules/TutorialSession.tsx` | Delete | Manual-only molecule |
| `scripts/capture_manual_screenshots.py` | Delete | Screenshot capture script |
| `scripts/generate_placeholder_screenshots.py` | Delete | Placeholder generation script |
| `public/screenshots/dashboard.png` | Delete | Manual screenshot |
| `public/screenshots/expedientes.png` | Delete | Manual screenshot |
| `public/screenshots/expediente-detalle.png` | Delete | Manual screenshot |
| `public/screenshots/consulta-nueva.png` | Delete | Manual screenshot |
| `public/screenshots/recepcion.png` | Delete | Manual screenshot |
| `public/screenshots/catalogo.png` | Delete | Manual screenshot |
| `public/screenshots/historial-ventas.png` | Delete | Manual screenshot |
| `openspec/specs/manual-usuario/spec.md` | Delete | Main capability spec |
| `openspec/changes/manual-usuario-interactivo/` | Delete | Entire active change directory (5 files) |
| `openspec/changes/archive/2026-06-14-manual-usuario-interactivo/` | Delete | Entire archived change directory (7 files) |

## Interfaces / Contracts

**No new types added.** Only deletions of unused interfaces:

```typescript
// REMOVED from src/types/index.ts:
export interface HotspotDef { ... }
export interface TutorialStep { ... }
export interface ManualSession { ... }
```

## Implementation Details

### Spec 1 — Double-Save Guard (NuevaConsultaPage)

Add state:
```typescript
const [isSaving, setIsSaving] = useState(false);
```

Guard handleSubmit:
```typescript
const handleSubmit = async () => {
    if (isSaving) return;           // ← new
    if (!selectedMascota || !motivo || !diagnostico) return;
    setIsSaving(true);              // ← new
    try {
      await crearConsulta({...});
      navigate('/recepcion');       // unmounts, no need to reset isSaving
    } catch (err) {
      setIsSaving(false);           // ← new: re-enable for retry
      toast.error(...);
    }
};
```

Button update (line 378):
```tsx
disabled={!isValid || isSaving}
```

### Spec 3 — Prefactura Grid Layout (DetailRecepcionDialog)

**Header** (line 228): Expand from 5 to 6 columns. Replace existing 5-`<div>` header row with 6 columns:
```
Código (span-2) | Nombre (span-2) | Descripción (span-3) | Cant. (span-1) | P.Unit. (span-2) | Sub. (span-2)
```

**Body rows** (lines 247-276): Add descripción cell between Nombre and Cantidad. The descripción value comes from `detalle.producto.descripcion`, already available in memory. Graceful fallback: show "—" when falsy.

Span changes per row column:
- `col-span-3` → `col-span-2` (Código)
- `col-span-4` → `col-span-2` (Nombre, was mislabeled "Descripción")
- NEW `col-span-3` (Descripción)
- `col-span-2` → `col-span-1` (Cantidad)
- `col-span-2` unchanged (P.Unit.)
- `col-span-1` → `col-span-2` (Subtotal)

### Spec 2 — Deletion Order

1. Delete 21 files in any order (no internal dependencies among deleted files)
2. Edit `tailwind.config.js` (remove keyframes + animations)
3. Edit `src/types/index.ts` (remove interfaces)
4. Edit `src/components/molecules/index.ts` (remove barrel exports)
5. Edit `src/App.tsx` (remove import + route)
6. Edit `src/components/organisms/Layout.tsx` (remove import + navItem)
7. Run `tsc -b` and `npm run lint` to verify zero references

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Double-click "Guardar Consulta" creates exactly 1 consulta | Manual QA: rapid double-click, verify via console/network tab only one request |
| Manual | Button shows disabled state during save | Visual inspection: click button, observe disabled appearance immediately |
| Manual | Prefactura shows all 6 columns correctly | Open any consulta prefactura, verify headers and data alignment |
| Build | `tsc -b` passes with zero errors | Run TypeScript compiler after all changes |
| Lint | `npm run lint` passes | Run ESLint after all changes |

## Migration / Rollout

No migration required. Rollback via `git revert`. No data changes, no schema changes.

## Open Questions

None.
