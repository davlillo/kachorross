# Supabase Edge Functions

## Deploy

1. Instala/abre Supabase CLI y autentícate.
2. En la raíz del proyecto, ejecuta:

```bash
supabase functions deploy admin-create-user
supabase functions deploy send-email
supabase functions deploy send-reminders
```

## Secrets requeridos

Configura en el proyecto Supabase:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
supabase secrets set CRON_SECRET=un_secreto_largo_para_el_cron
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` son provistos automáticamente por entorno de funciones.

## Función `send-reminders`

- Recordatorios automáticos **1 día antes** (controles, vacunas, desparasitaciones, eventos manuales).
- Un correo consolidado por propietario.
- Requiere SMTP activo en `config_email` por veterinaria.
- Se puede invocar desde la app (usuario autenticado) **o** con `CRON_SECRET` desde cron.
- Si configuraste `CRON_SECRET`, la app también funciona: acepta JWT de usuario o el secret del cron.
- Programar cron en Supabase Dashboard (ej. `0 13 * * *` ≈ 7:00 AM El Salvador):

```bash
curl -X POST "https://TU_PROYECTO.supabase.co/functions/v1/send-reminders" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## Función `admin-create-user`

- Requiere JWT válido (`verify_jwt = true`).
- Verifica que el caller tenga rol `admin` en `public.perfiles`.
- Crea usuario en `auth.users` con `email_confirm: true`.
- Upsert en `public.perfiles` con `nombre`, `email`, `rol`, `avatar`.
