# Supabase Edge Functions

## Deploy

1. Instala/abre Supabase CLI y autentícate.
2. En la raíz del proyecto, ejecuta:

```bash
supabase functions deploy admin-create-user
```

## Secrets requeridos

Configura en el proyecto Supabase:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` son provistos automáticamente por entorno de funciones.

## Función `admin-create-user`

- Requiere JWT válido (`verify_jwt = true`).
- Verifica que el caller tenga rol `admin` en `public.perfiles`.
- Crea usuario en `auth.users` con `email_confirm: true`.
- Upsert en `public.perfiles` con `nombre`, `email`, `rol`, `avatar`.
