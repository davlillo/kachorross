-- Migration: Add tema column to veterinarias for clinic theming
ALTER TABLE veterinarias ADD COLUMN IF NOT EXISTS tema JSONB DEFAULT NULL;

COMMENT ON COLUMN veterinarias.tema IS 'Clinic theme configuration: { paletteId: string, updatedAt: string }';
