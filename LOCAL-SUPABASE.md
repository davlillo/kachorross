# Supabase local para desarrollo

El entorno de desarrollo usa una instancia local de Supabase ejecutada en Docker y administrada por **Supabase CLI**. No se usa la base de producción en desarrollo.

> **No hace falta instalar la CLI.** Se ejecuta bajo demanda con `npx` (npm) o `pnpm dlx` (pnpm), como en el proyecto `aseisi`. Docker sí es obligatorio.

## Requisitos

- **Docker Desktop** instalado y ejecutándose (con el engine Linux activo).
- Node.js y las dependencias del proyecto instaladas.

Verificar Docker:

```powershell
docker version
```

Si el comando falla, abrí Docker Desktop y esperá a que diga "Engine running".

## Levantar Supabase local (Docker)

Desde la raíz del repositorio:

```powershell
npm run supabase:start
```

O si usás pnpm:

```powershell
pnpm dlx supabase start
```

El primer inicio descarga las imágenes de Supabase y crea los contenedores. Puede tardar varios minutos. Al terminar quedan corriendo los servicios de la API, la base de datos, Auth, Storage, Realtime y Studio.

Los puertos locales usados (definidos en `supabase/config.toml`):

| Servicio | URL o puerto |
|---|---:|
| Supabase API | `http://127.0.0.1:54321` |
| PostgreSQL | `127.0.0.1:54322` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |

## Configurar el .env

Copiá `.env.example` a `.env` si todavía no existe. Después de `supabase:start`, obtené la anon key local:

```powershell
npm run supabase:status -o env
# o: npx supabase status -o env
```

Buscá la variable `ANON_KEY` en la salida y pegala en `VITE_SUPABASE_ANON_KEY` dentro de `.env`. La URL debe quedar así:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
```

`.env` no se versiona. Cada integrante arma su copia local con su propio `ANON_KEY` (es distinto por máquina).

## Usuario admin (incluido en la migración)

La migración inicial crea el primer administrador, listo para entrar a la app sin pasos extra:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@kachorros.com | 12345678 |

Queda asociado a la veterinaria local "Kachorros local". Los usuarios del mock (`doctora@`, `recepcion@`) no existen en la base local: solo funcionan cuando se usa la autenticación mock de desarrollo.

## Base de datos y migraciones

La migración inicial versionada está en:

```text
supabase/migrations/00000000000000_initial_schema.sql
```

Las migraciones se aplican en orden desde `supabase/migrations/`. Para reconstruir la base local desde cero:

```powershell
npm run supabase:reset
```

Este comando borra los datos locales, recrea el esquema y aplica todas las migraciones. No lo uses si querés conservar datos locales.

Para aplicar solo migraciones pendientes sin borrar datos:

```powershell
npm run supabase:migration
```

## Entrar a la base por consola

El contenedor de la base se llama `supabase_db_kachorross-local` (el sufijo sale de `project_id` en `supabase/config.toml`). Para ejecutar SQL:

```powershell
docker exec -i supabase_db_kachorross-local psql -U postgres -d postgres
```

## Comandos habituales

```powershell
# Levantar los contenedores
npm run supabase:start

# Ver estado y credenciales
npm run supabase:status

# Ver solo las variables (incluye ANON_KEY)
npx supabase status -o env

# Aplicar migraciones pendientes
npm run supabase:migration

# Reiniciar la base local desde cero (borra datos)
npm run supabase:reset

# Detener contenedores conservando los datos
npm run supabase:stop

# Detener y eliminar también los datos locales
npx supabase stop --no-backup
```

## Edge Functions

Para probar funciones locales:

```powershell
npx supabase functions serve
```

Los secretos de desarrollo deben ser locales y no los de producción. Para correos, usá Mailpit en `http://127.0.0.1:54324`.

## Flujo diario

1. Abrí Docker Desktop.
2. Ejecutá `npm run supabase:start`.
3. Confirmá que `.env` use `http://127.0.0.1:54321`.
4. Ejecutá `npm run dev`.
5. Al terminar, `npm run supabase:stop` si no necesitás mantener los servicios.

## Reglas de seguridad

- No pongas URLs, anon keys ni service role keys de **producción** en `.env.example`.
- No ejecutes `supabase link` ni comandos con `--linked` para el flujo normal de desarrollo.
- No ejecutes `supabase db push --linked` desde una máquina de desarrollo.
- No compartas archivos `.env` ni valores de `SUPABASE_SERVICE_ROLE_KEY`.
- Antes de probar, confirmá que `VITE_SUPABASE_URL` contiene `127.0.0.1`.

## Solución de problemas

### Docker no responde

Abrí Docker Desktop y esperá a que el engine esté listo. Luego repetí `npm run supabase:start`.

### Un puerto está ocupado

Cambiá el puerto en `supabase/config.toml` y reflejalo en `.env.example` y `.env`.

### La aplicación sigue usando producción

Detené Vite, revisá `.env`, confirmá `VITE_SUPABASE_URL=http://127.0.0.1:54321` y volvé a ejecutar `npm run dev`. Vite carga las variables al iniciar; cambiar `.env` sin reiniciar no alcanza.

### Error al conectar la base

Si la base quedó en un estado inconsistente, ejecutá `npm run supabase:reset` para reconstruirla desde las migraciones.

### Permission denied for table

Si PostgREST devuelve `permission denied for table <tabla>`, faltan los `GRANT` a los roles de Supabase. Se resuelven con la migración `20260821_supabase_grants.sql`. Si tu copia local está desactualizada, ejecutá:

```powershell
npm run supabase:migration
```

## Verificación del arranque

Después de `supabase start`, la API local debe responder. Probá con el anon key:

```powershell
curl -H "apikey: TU_ANON_KEY" "http://127.0.0.1:54321/auth/v1/health"
```

Debería devolver `200` y el JSON de GoTrue. Studio queda en `http://127.0.0.1:54323`.

Nota: los datos del catálogo y las consultas están protegidos por RLS por veterinaria, así que solo se ven tras iniciar sesión con un usuario de la veterinaria local. El arranque crea la veterinaria "Kachorros local" y 389 productos de catálogo.
