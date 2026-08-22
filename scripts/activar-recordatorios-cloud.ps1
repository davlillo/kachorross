# Activa recordatorios automáticos en Supabase CLOUD
# Requiere: npx supabase login  (o SUPABASE_ACCESS_TOKEN en el entorno)
#
# Uso:
#   npm run supabase:activar-recordatorios
#   npm run supabase:activar-recordatorios -- -DbPassword "tu-db-password"

param(
  [string]$ProjectRef = "qrutwnljkfsfbizaqsqj",
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "`n=== Kachorros: activar recordatorios automáticos (cloud) ===" -ForegroundColor Cyan

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  $whoami = npx supabase projects list 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: No hay sesión de Supabase CLI." -ForegroundColor Red
    Write-Host "1. En TU terminal (no en el agente), ejecuta:  npx supabase login"
    Write-Host "2. Vuelve a correr:  npm run supabase:activar-recordatorios"
    Write-Host "`nAlternativa: crea un token en https://supabase.com/dashboard/account/tokens"
    Write-Host '   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."'
    exit 1
  }
}

Write-Host "`n[1/5] Enlazando proyecto $ProjectRef ..." -ForegroundColor Yellow
if ($DbPassword) {
  npx supabase link --project-ref $ProjectRef --password $DbPassword --yes
} else {
  npx supabase link --project-ref $ProjectRef --yes
}
if ($LASTEXITCODE -ne 0) { throw "Falló supabase link. Pasa la contraseña de DB: npm run supabase:activar-recordatorios -- -DbPassword `"tu-password`"" }

Write-Host "`n[2/5] Desplegando send-email ..." -ForegroundColor Yellow
npx supabase functions deploy send-email --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw "Falló deploy send-email" }

Write-Host "`n[3/5] Desplegando send-reminders ..." -ForegroundColor Yellow
npx supabase functions deploy send-reminders --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw "Falló deploy send-reminders" }

Write-Host "`n[4/5] Programando cron diario (pg_cron + pg_net) ..." -ForegroundColor Yellow
npx supabase db query --linked --project-ref $ProjectRef -f supabase/setup_recordatorios_cron.sql
if ($LASTEXITCODE -ne 0) { throw "Falló SQL del cron. Activa pg_cron y pg_net en Dashboard > Database > Extensions" }

Write-Host "`n[5/5] Verificando job ..." -ForegroundColor Yellow
npx supabase db query --linked --project-ref $ProjectRef "SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'kachorros-recordatorios-diario';"

Write-Host "`n=== Listo ===" -ForegroundColor Green
Write-Host "El cron corre ~7:00 AM (El Salvador) y manda correos para citas de MAÑANA."
Write-Host "Prueba manual (opcional):"
Write-Host "  curl -X POST `"https://$ProjectRef.supabase.co/functions/v1/send-reminders`" -H `"Content-Type: application/json`" -d `"{}`""
