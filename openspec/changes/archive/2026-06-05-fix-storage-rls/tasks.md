# Tasks: Fix Storage RLS — Multi-Tenant File Isolation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 85–100 (additions + deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Storage RLS Policies

- [x] 1.1 Replace `mascotas` SELECT policy: vet-scoped USING with `(storage.foldername(name))[1]` matched against `(SELECT veterinaria_id::text FROM perfiles WHERE id = auth.uid())`, super_admin bypass (`rol = 'super_admin'`), and root-file fallback (`foldername IS NULL`)
- [x] 1.2 Replace `mascotas` INSERT policy: FOR INSERT TO authenticated WITH CHECK same folder rule (no super_admin bypass needed for write)
- [x] 1.3 Replace `mascotas` UPDATE policy: FOR UPDATE TO authenticated USING same folder rule
- [x] 1.4 Replace `mascotas` DELETE policy: FOR DELETE TO authenticated USING same folder rule
- [x] 1.5 Replace `fotos_evolucion` SELECT policy: identical pattern as mascotas SELECT (no super_admin bypass needed on read? actually yes for consistency)
- [x] 1.6 Replace `fotos_evolucion` INSERT policy: FOR INSERT TO authenticated WITH CHECK same folder rule
- [x] 1.7 Replace `fotos_evolucion` UPDATE policy: FOR UPDATE TO authenticated USING same folder rule
- [x] 1.8 Replace `fotos_evolucion` DELETE policy: FOR DELETE TO authenticated USING same folder rule

**File:** `supabase/setup_storage.sql` — lines 44–76 replaced with vet-scoped policies (~32 lines removed, ~40 lines added)

## Phase 2: Frontend Upload Path Fix

- [x] 2.1 Import `AuthController` in `page.tsx` to resolve `veterinariaId` during upload
- [x] 2.2 In `subirFotoMascota()`, add early guard: resolve current user, throw if no `veterinariaId`
- [x] 2.3 Change upload path from `mascotas/${uuid}.ext` to `${veterinariaId}/${uuid}.ext` (mascotaId not yet available; it is created after upload in the page flow)

**File:** `src/app/expedientes/nuevo/page.tsx` — lines 94–115 modified (~12 lines changed)

## Phase 3: Verification

- [x] 3.1 Verify SQL: confirm `storage.foldername()` extracts first path segment correctly against UUID-format `veterinaria_id`
- [x] 3.2 Verify SQL: confirm super_admin bypass works (SELECT only) by checking `EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'super_admin')`
- [x] 3.3 Verify SQL: confirm root-level files (no folder prefix) remain accessible via `OR (storage.foldername(name))[1] IS NULL`
- [x] 3.4 Verify frontend: `subirFotoMascota` produces path with `veterinariaId/` prefix, matching the controller pattern at `mascota.controller.ts:367`
- [x] 3.5 Run `npm run build` to confirm no TypeScript/compilation errors
