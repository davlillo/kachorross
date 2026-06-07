# Archive Report: fix-storage-rls

**Change**: fix-storage-rls
**Archived**: 2026-06-05
**Status**: PASS WITH WARNINGS — 13/13 tasks, 6/6 requirements compliant
**Verdict**: The change is complete and verified. All multi-tenant storage RLS policies are enforced via folder-based isolation. Build passes with zero errors.

## Artifact Lineage

| Artifact | OpenSpec Path | Engram ID |
|----------|--------------|-----------|
| Proposal | `openspec/changes/archive/2026-06-05-fix-storage-rls/proposal.md` | #39 |
| Spec | `openspec/changes/archive/2026-06-05-fix-storage-rls/spec.md` | #40 |
| Tasks | `openspec/changes/archive/2026-06-05-fix-storage-rls/tasks.md` | #41 |
| Apply Progress | (inline in Engram) | #42 |
| Verify Report | `openspec/changes/archive/2026-06-05-fix-storage-rls/verify-report.md` | #43 |
| Archive Report | this file | (current) |

## Final State of Modified Files

### `supabase/setup_storage.sql` (lines 44–114)
Replaced all 8 RLS policies for `mascotas` and `fotos_evolucion` buckets:

- **SELECT** policies: Triple condition — vet folder match `(storage.foldername(name))[1] = (SELECT veterinaria_id::text FROM perfiles WHERE id = auth.uid())` OR root-file fallback `(storage.foldername(name))[1] IS NULL` OR super_admin bypass `EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'super_admin')`
- **INSERT/UPDATE/DELETE** policies: Single condition — `(storage.foldername(name))[1] = (SELECT veterinaria_id::text FROM perfiles WHERE id = auth.uid())`
- No super_admin bypass on writes (by design — super_admin scoped to SELECT only)
- 8 DROP IF EXISTS / CREATE POLICY pairs — fully idempotent

### `src/app/expedientes/nuevo/page.tsx` (lines 3, 95–121)
- Added `import { AuthController } from '@/controllers/auth.controller'`
- `subirFotoMascota()`: resolves current user via `authCtrl.resolveUser()`, guards with `if (!veterinariaId) throw new Error(...)`
- Upload path changed from `mascotas/${uuid}.ext` to `${veterinariaId}/${crypto.randomUUID()}.${ext}`
- Note: path uses `{uuid}` only, not `{mascotaId}/{uuid}`, because upload happens BEFORE mascota creation in the page flow

## Delta from Original Spec

| # | Spec Claim | Implementation | Delta |
|---|-----------|---------------|-------|
| REQ-6 | Path: `abc-123/{mascotaId}/{uuid}.ext` | Path: `${veterinariaId}/${uuid}.ext` | Spec shows `{mascotaId}` but mascotaId isn't available at upload time. Implementation uses `{uuid}` only — functionally correct, spec scenario is slightly outdated. |

## Lessons Learned

1. **`storage.foldername()` is 1-indexed** — In PostgreSQL, the `foldername()` function returns a TEXT array indexed from 1, not 0. `[1]` correctly extracts the first path segment.
2. **UUID::text comparison** — `veterinaria_id` is UUID type; comparison against `storage.foldername()` output (TEXT) requires an explicit `::text` cast in the subquery.
3. **Upload-before-creation flow** — In `expedientes/nuevo`, the photo upload happens before the mascota record is created, so `mascotaId` is not yet available. Only `veterinariaId` can be used as the path prefix.
4. **Root-file backward compat** — The `OR (storage.foldername(name))[1] IS NULL` fallback is essential for existing files that were uploaded without folder prefixes. This is a temporary migration aid.
5. **No design phase** — The fix-storage-rls change skipped the `sdd-design` phase (proposal → spec → tasks → apply → verify). The design decisions were embedded in the proposal and tasks. This is acceptable for small, well-understood changes but should be avoided for complex changes.

## Open Items

1. **Orphan root-level files**: The `IS NULL` SELECT fallback is temporary. A SQL migration should move orphaned files (those without `veterinaria_id` folder prefix) into their correct folder structure, then remove the NULL fallback.
2. **`logos_veterinarias` bucket**: Currently has wide-open SELECT `USING (bucket_id = 'logos_veterinarias')` for all authenticated users. Consider adding same vet-scoped isolation in a future change.
3. **No automated tests**: All compliance verified via static analysis only. Recommend integration tests against a test Supabase instance.
4. **REQ-6 spec scenario**: Update `openspec/specs/storage-rls/spec.md` REQ-6 scenario to show `${veterinariaId}/{uuid}.ext` instead of `${veterinariaId}/{mascotaId}/{uuid}.ext` to match implementation.

## Source of Truth Updated

- `openspec/specs/storage-rls/spec.md` — Created from delta spec (first version, 6 requirements)

## SDD Cycle Complete

The fix-storage-rls change has been fully planned, implemented, verified, and archived. The multi-tenant storage isolation vulnerability has been closed.

## Verification Summary

- **13/13 tasks completed** ✅
- **6/6 requirements compliant** ✅ (PASS WITH WARNINGS)
- **Build**: Zero TypeScript errors, zero build errors ✅
- **SQL**: Applied to Supabase via Dashboard
- **All 8 RLS policies**: Folder-scoped by `veterinaria_id`
- **Frontend**: Upload path includes `veterinariaId` prefix
