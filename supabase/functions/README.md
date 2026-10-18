# Supabase Edge Functions

## Deploy

1. Instala/abre Supabase CLI y autentícate.
2. En la raíz del proyecto, ejecuta:

```bash
supabase functions deploy admin-create-user
supabase functions deploy send-email
supabase functions deploy send-reminders
supabase functions deploy send-export-documents
```

## Secrets requeridos

Configura en el proyecto Supabase:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
supabase secrets set CRON_SECRET=un_secreto_largo_para_el_cron
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` son provistos automáticamente por entorno de funciones.

## Función `send-export-documents`

- Aplicar primero las migraciones `20261014000000` a `20261014040000` (y las de hospedaje `20261004000000` a `20261013000000` si se usa ese módulo).
- Usa el SMTP activo de la veterinaria en `config_email`.
- Valida en el servidor el rol, la clínica, el trámite completado y el correo actual del propietario.
- Registra los intentos y sus resultados en `envios_exportacion`.
- En desarrollo, `node scripts/verify-export-documents.mjs` ejecuta un smoke test solo contra Supabase local; requiere `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY` y `SUPABASE_TEST_SERVICE_ROLE_KEY`.

> **Historial remoto:** el proyecto `qrutwnljkfsfbizaqsqj` tenía tablas base y la tabla de exportaciones creadas fuera de la CLI, pero no registraba sus migraciones anteriores a `20261004000000`. Se aplicaron únicamente las migraciones `20261004000000` a `20261014040000` desde una carpeta temporal con las versiones originales. No ejecutes `supabase db push` desde la raíz todavía: intentaría reaplicar la migración inicial y otras anteriores. Primero hay que auditar el esquema y reconciliar su historial, sin marcar migraciones como aplicadas a ciegas.

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
