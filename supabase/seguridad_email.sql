-- Configuración SMTP por veterinaria (para envío de correos)
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

-- RLS
ALTER TABLE config_email ENABLE ROW LEVEL SECURITY;

-- Política: admin y super_admin pueden ver/configurar el email de su veterinaria
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

-- Política: super_admin puede ver todas
DROP POLICY IF EXISTS "config_email_super_admin_all" ON config_email;
CREATE POLICY "config_email_super_admin_all" ON config_email
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'super_admin')
    );

-- Trigger para updated_at
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
