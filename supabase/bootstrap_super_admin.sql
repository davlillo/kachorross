-- =========================================================================
-- SCRIPT DE BOOTSTRAP PARA EL PRIMER SUPER ADMIN
-- =========================================================================
-- Instrucciones:
-- 1. Ve al panel de Supabase -> Authentication -> Users
-- 2. Crea un nuevo usuario manualmente (ej. admin@kachorros.com)
-- 3. Copia el UUID de ese usuario recién creado
-- 4. Reemplaza 'TU-UUID-AQUI' y 'TU-EMAIL-AQUI' en este script
-- 5. Ejecuta este script en el SQL Editor de Supabase
-- =========================================================================

DO $$
DECLARE
    v_user_id UUID := 'TU-UUID-AQUI'; -- <-- REEMPLAZA ESTO
    v_email TEXT := 'TU-EMAIL-AQUI';  -- <-- REEMPLAZA ESTO
BEGIN
    -- Verificar si el usuario existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'El usuario con ID % no existe en auth.users. Créalo primero en el panel de Authentication.', v_user_id;
    END IF;

    -- Insertar o actualizar el perfil como super_admin
    INSERT INTO public.perfiles (id, nombre, email, rol, veterinaria_id, activo)
    VALUES (
        v_user_id,
        'Super Administrador',
        v_email,
        'super_admin',
        NULL, -- El super admin no pertenece a ninguna veterinaria en particular
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        rol = 'super_admin',
        nombre = 'Super Administrador',
        veterinaria_id = NULL;

    RAISE NOTICE '✅ Perfil de Super Admin configurado correctamente para el usuario %', v_email;
END $$;
