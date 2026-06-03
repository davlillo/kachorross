-- =====================================================
-- RECORDATORIOS AUTOMÁTICOS — ejecutar UNA VEZ en SQL Editor
-- =====================================================
--
-- Qué hace: cada día ~7:00 AM (El Salvador) llama a send-reminders
-- y manda correos a propietarios con controles/vacunas/desparas para MAÑANA.
--
-- ANTES de ejecutar:
--   1. Edge Function "send-reminders" creada en Supabase
--   2. Edge Functions → send-reminders → detalles/config:
--      DESACTIVAR "Verify JWT" / "Enforce JWT Verification"
--   3. Cambiar abajo: reemplaza TU_PROJECT_REF por tu Reference ID
--      (Project Settings → General → Reference ID)
--   4. Database → Extensions: activar pg_cron y pg_net si no lo están
--
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Quitar job previo (si ya existía)
DO $$
BEGIN
  PERFORM cron.unschedule('kachorros-recordatorios-diario');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 0 13 * * * = 13:00 UTC ≈ 7:00 AM El Salvador
SELECT cron.schedule(
  'kachorros-recordatorios-diario',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qrutwnljkfsfbizaqsqj.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);

-- Verificar que quedó programado:
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'kachorros-recordatorios-diario';
