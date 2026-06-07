# Proposal: Fix Storage RLS — Multi-Tenant Isolation

## Intent

Storage RLS policies for buckets `mascotas` and `fotos_evolucion` only check `auth.role() = 'authenticated'` — any user from ANY clinic can INSERT/UPDATE/DELETE files. This breaks multi-tenant data isolation (HIGH severity). Fix: enforce `veterinaria_id` scoping on all write operations.

## Scope

### In Scope
- Add `veterinaria_id`-scoped RLS policies to `mascotas` and `fotos_evolucion` storage buckets
- Fix orphan upload path in `expedientes/nuevo/page.tsx` missing `veterinariaId` prefix
- Ensure SELECT policies also isolate reads per-vet (currently wide-open `true`)

### Out of Scope
- `logos_veterinarias` bucket (already appropriate for super_admin usage)
- `send-reminders` cron auth hardening (separate change)
- `VeterinariaController.getAll()` scoping (separate change)

## Capabilities

### New Capabilities
- `storage-rls`: Cross-bucket RLS policy that validates `veterinaria_id` from file path tokens against user profile

### Modified Capabilities
None — storage policies are currently infrastructure configuration, not spec-backed capabilities.

## Approach

**Strategy**: Folder-based isolation using existing path convention `{veterinaria_id}/{...}`.

**Why folder-based over metadata**: Storage objects lack a `veterinaria_id` column. Supabase's `storage.foldername(name)[1]` extracts the first path segment — clean, zero-schema-change approach.

**Policy pattern** (replaces current per-bucket policies):
```sql
-- SELECT: users only see files in their vet's folder
USING (bucket_id = 'mascotas' AND (storage.foldername(name))[1] =
  (SELECT veterinaria_id::text FROM perfiles WHERE id = auth.uid()))

-- INSERT/UPDATE/DELETE: same folder check
WITH CHECK (bucket_id = 'mascotas' AND (storage.foldername(name))[1] =
  (SELECT veterinaria_id::text FROM perfiles WHERE id = auth.uid()))
```

**Frontend fix**: `expedientes/nuevo/page.tsx:98` uses `mascotas/${uuid}.ext` — lacks `veterinariaId`. Already fixed in `MascotaController` (lines 367, 403) which uses `${veterinariaId}/${mascotaId}/${uuid}.ext`. Apply same pattern.

**Note**: `auth.uid()` returns UUID, `veterinaria_id` is UUID — cast to `::text` for string comparison with folder name.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/setup_storage.sql` | Modified | Replace 8 policies (lines 45-76) with vet-scoped versions |
| `src/app/expedientes/nuevo/page.tsx` | Modified | Fix upload path at line 98 to include `veterinariaId` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing files without `veterinariaId` prefix become inaccessible | Medium | Run migration script to move orphaned files into folder structure, or grandfather clause for old paths |
| RLS breaks legitimate cross-vet sharing (e.g., super_admin) | Low | Super-admin bypass possible via separate policy with `EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'super_admin')` |
| `storage.foldername()` returns NULL for root-level files → policy rejects everything | Medium | Add fallback: `OR (storage.foldername(name))[1] IS NULL` for backward compat, then clean up later |

## Rollback Plan

Revert `setup_storage.sql` to previous policies (8 lines each for `mascotas` + `fotos_evolucion`, SELECT open + auth-gated writes). Revert page.tsx line 98. No data loss — files remain in storage, just access rules change.

## Dependencies

None — self-contained SQL + one frontend line change.

## Success Criteria

- [ ] User from Clinic A cannot see/modify files in `{clinicB_id}/...` paths via Supabase SDK
- [ ] User from Clinic A CAN see/modify files in `{clinicA_id}/...` paths
- [ ] `expedientes/nuevo` upload creates file under correct `veterinariaId` folder
