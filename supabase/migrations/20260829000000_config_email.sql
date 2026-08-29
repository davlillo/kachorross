-- Configuración SMTP por veterinaria (para envío de correos).
--
-- Esta tabla existía solo en supabase/seguridad_email.sql, que se ejecutaba a mano
-- en el SQL Editor y por lo tanto no se reproducía con `supabase db reset` ni en un
-- entorno nuevo. Sin ella, send-reminders no puede enviar: cae siempre en la rama
-- "Sin SMTP configurado". Se versiona aquí de forma idempotente para que local y
-- producción queden iguales.

CREATE TABLE IF NOT EXISTS config_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veterinaria_id UUID NOT NULL UNIQUE REFERENCES veterinarias(id) ON DELETE CASCADE,
    smtp_host VARCHAR(100) DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(100) NOT NULL,
    smtp_pass TEXT NOT NULL,
    from_name VARCHAR(100),
    from_email VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Los GRANT de 20260821_supabase_grants.sql corrieron antes de que existiera esta
-- tabla, y GRANT ... ON ALL TABLES solo alcanza a las tablas de ese momento.
GRANT ALL ON TABLE config_email TO anon, authenticated, service_role;

ALTER TABLE config_email ENABLE ROW LEVEL SECURITY;

-- Admin y super_admin gestionan el SMTP de su propia veterinaria.
DROP POLICY IF EXISTS "config_email_admin_access" ON config_email;
CREATE POLICY "config_email_admin_access" ON config_email
    FOR ALL
    USING (
        veterinaria_id IN (
            SELECT p.veterinaria_id FROM perfiles p WHERE p.id = auth.uid()
            AND (p.rol = 'admin' OR p.rol = 'super_admin')
        )
    )
    WITH CHECK (
        veterinaria_id IN (
            SELECT p.veterinaria_id FROM perfiles p WHERE p.id = auth.uid()
            AND (p.rol = 'admin' OR p.rol = 'super_admin')
        )
    );

-- super_admin puede leer la configuración de todas las clínicas.
DROP POLICY IF EXISTS "config_email_super_admin_all" ON config_email;
CREATE POLICY "config_email_super_admin_all" ON config_email
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'super_admin')
    );

CREATE OR REPLACE FUNCTION update_config_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_config_email_updated_at ON config_email;
CREATE TRIGGER trigger_config_email_updated_at
    BEFORE UPDATE ON config_email
    FOR EACH ROW
    EXECUTE FUNCTION update_config_email_updated_at();
