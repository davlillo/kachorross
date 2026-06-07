# Storage RLS — Multi-Tenant File Isolation

## Purpose

Enforce `veterinaria_id`-scoped access control on Supabase Storage buckets `mascotas` and `fotos_evolucion`. Currently any authenticated user can read/write/delete files across clinics. The fix uses folder-based isolation via `storage.foldername(name)[1]` matched against the user's profile, requiring no schema changes.

## Requirements

### REQ-1: Write Isolation (INSERT)
The system **MUST** reject INSERT operations on `mascotas` and `fotos_evolucion` buckets unless the file path's first folder segment matches the uploading user's `veterinaria_id`.

#### Scenario: Same-vet upload succeeds
- **GIVEN** a user with `veterinaria_id = 'abc-123'`  
- **WHEN** uploading to `abc-123/perro01/foto.jpg`  
- **THEN** upload succeeds  

#### Scenario: Cross-vet upload rejected
- **GIVEN** a user with `veterinaria_id = 'abc-123'`  
- **WHEN** uploading to `xyz-999/perro01/foto.jpg`  
- **THEN** upload fails with policy violation  

### REQ-2: Write Isolation (UPDATE)
The system **MUST** reject UPDATE operations under the same folder-based ownership check as REQ-1.

#### Scenario: Owner updates own file
- **GIVEN** user has `veterinaria_id = 'abc-123'` and file `abc-123/perro01/old.jpg` exists  
- **WHEN** updating to `abc-123/perro01/new.jpg`  
- **THEN** update succeeds  

#### Scenario: Non-owner update rejected
- **GIVEN** user has `veterinaria_id = 'def-456'`  
- **WHEN** updating file at `abc-123/perro01/old.jpg`  
- **THEN** update fails with policy violation  

### REQ-3: Write Isolation (DELETE)
The system **MUST** reject DELETE operations using the same folder-based ownership check.

#### Scenario: Owner deletes own file
- **GIVEN** user has `veterinaria_id = 'abc-123'` and file `abc-123/perro01/foto.jpg`  
- **WHEN** deleting that file  
- **THEN** deletion succeeds  

#### Scenario: Cross-vet delete rejected
- **GIVEN** user from vet B attempting to delete `abc-123/perro01/foto.jpg`  
- **WHEN** delete is attempted  
- **THEN** operation fails with policy violation  

### REQ-4: Read Scoping (SELECT)
The system **SHALL** restrict SELECT to files within the user's `veterinaria_id` folder, except for `logos_veterinarias` (public) and `super_admin` (global access).

#### Scenario: Vet user lists own folder
- **GIVEN** user with `veterinaria_id = 'abc-123'`  
- **WHEN** listing `mascotas` bucket  
- **THEN** only files under `abc-123/` are visible  

#### Scenario: Cross-vet read blocked
- **GIVEN** user with `veterinaria_id = 'def-456'`  
- **WHEN** listing `fotos_evolucion` bucket  
- **THEN** files under `abc-123/` are not visible  

### REQ-5: Backward Compatibility for Root-Level Files
The system **SHOULD** allow access to files at bucket root (no folder prefix) during migration to prevent breaking existing data.

#### Scenario: Root-level file remains accessible
- **GIVEN** a file exists at `mascotas/legacy-photo.jpg` (no folder prefix)  
- **WHEN** any authenticated user accesses it  
- **THEN** access succeeds during migration window  

### REQ-6: Frontend Upload Path Compliance
The `expedientes/nuevo` page **MUST** prepend the user's `veterinariaId` to the upload file path, matching the `MascotaController` convention.

#### Scenario: New expediente upload uses correct path
- **GIVEN** user with `veterinariaId = 'abc-123'` creating a new expediente with photo  
- **WHEN** photo is uploaded  
- **THEN** file path is `abc-123/{mascotaId}/{uuid}.ext` not `mascotas/{uuid}.ext`
